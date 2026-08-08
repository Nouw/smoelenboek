import type { UserDto } from '@repo/api';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { toUserDto } from '../dto/user-output';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UsersRepository } from '../repositories/users.repository';
import { UpdateUserProfileCommand } from './update-user-profile.command';

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileHandler
  implements ICommandHandler<UpdateUserProfileCommand, UserDto>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<UserDto> {
    const event = UserProfileUpdatedEvent.create({
      userId: command.userId,
      imageUrl: command.input.imageUrl,
    });
    await this.eventStorePublisher.appendAndPublish(event);
    const user = await this.usersRepository.findById(command.userId);
    if (!user) throw new NotFoundException('User not found.');
    return toUserDto(user);
  }
}
