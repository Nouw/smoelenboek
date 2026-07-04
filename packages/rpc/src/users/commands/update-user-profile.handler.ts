import type { UserDto } from '@repo/api';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { toUserDto } from '../dto/user-output';
import { createUserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UserProjector } from '../projectors/user-projector';
import { UpdateUserProfileCommand } from './update-user-profile.command';

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileHandler
  implements ICommandHandler<UpdateUserProfileCommand, UserDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly userProjector: UserProjector,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<UserDto> {
    const event = createUserProfileUpdatedEvent({
      userId: command.userId,
      imageUrl: command.input.imageUrl,
    });

    const user = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.userProjector.projectProfileUpdated(event.payload, manager),
    );

    return toUserDto(user);
  }
}
