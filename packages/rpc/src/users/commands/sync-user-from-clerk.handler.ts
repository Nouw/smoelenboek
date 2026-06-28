import type { UserDto } from '@repo/api';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import type { ClerkClaims } from '../../auth/auth-context';
import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { toUserDto } from '../dto/user-output';
import { createUserSyncedFromClerkEvent } from '../events/user-synced-from-clerk.event';
import { UserProjector } from '../projectors/user-projector';
import { SyncUserFromClerkCommand } from './sync-user-from-clerk.command';

@CommandHandler(SyncUserFromClerkCommand)
export class SyncUserFromClerkHandler
  implements ICommandHandler<SyncUserFromClerkCommand, UserDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly userProjector: UserProjector,
  ) {}

  async execute(command: SyncUserFromClerkCommand): Promise<UserDto> {
    const event = createUserSyncedFromClerkEvent({
      clerkUserId: command.clerkUserId,
      email: this.readStringClaim(command.claims, 'email'),
      firstName: this.readStringClaim(command.claims, 'first_name'),
      lastName: this.readStringClaim(command.claims, 'last_name'),
      imageUrl: this.readStringClaim(command.claims, 'image_url'),
    });

    const user = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.userProjector.projectSyncedFromClerk(event.payload, manager),
    );

    return toUserDto(user);
  }

  private readStringClaim(
    claims: ClerkClaims,
    key: keyof ClerkClaims,
  ): string | null {
    const value = claims[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
