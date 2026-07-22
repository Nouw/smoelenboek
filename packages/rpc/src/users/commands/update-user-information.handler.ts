import type { UserInformationDto } from '@repo/api';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { toUserInformationDto } from '../dto/user-information-output';
import { createUserInformationUpdatedEvent } from '../events/user-information-updated.event';
import { UserInformationProjector } from '../projectors/user-information-projector';
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
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly userInformationProjector: UserInformationProjector,
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

    const existing = await this.userInformationRepository.findByUserId(
      command.targetUserId,
    );
    assertValidMembershipDates(existing, command.changes);

    const event = createUserInformationUpdatedEvent(
      {
        userId: command.targetUserId,
        changes: command.changes,
      },
      command.actorUserId,
    );
    const information = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.userInformationProjector.projectUpdated(event.payload, manager),
    );

    return toUserInformationDto(information, true);
  }
}
