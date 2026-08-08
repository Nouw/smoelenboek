import type { UserInformationDto } from '@repo/api';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { toUserInformationDto } from '../dto/user-information-output';
import { UserInformationUpdatedEvent } from '../events/user-information-updated.event';
import { UserInformationRepository } from '../repositories/user-information.repository';
import { UsersRepository } from '../repositories/users.repository';
import {
  assertCanUpdateUserInformation,
  assertValidMembershipDates,
} from '../user-information-policy';
import { UpdateUserInformationCommand } from './update-user-information.command';

@CommandHandler(UpdateUserInformationCommand)
export class UpdateUserInformationHandler
  implements ICommandHandler<UpdateUserInformationCommand, UserInformationDto>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly userInformationRepository: UserInformationRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(
    command: UpdateUserInformationCommand,
  ): Promise<UserInformationDto> {
    assertCanUpdateUserInformation(
      command.actorUserId,
      command.actorRole,
      command.targetUserId,
    );

    const targetUser = await this.usersRepository.findById(
      command.targetUserId,
    );
    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    assertValidMembershipDates(targetUser.createdAt, command.changes);

    const event = UserInformationUpdatedEvent.create(
      { userId: command.targetUserId, changes: command.changes },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const information = await this.userInformationRepository.findByUserId(
      command.targetUserId,
    );
    if (!information) throw new Error('User information projection missing after dispatch.');
    return toUserInformationDto(information, true);
  }
}
