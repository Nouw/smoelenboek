import type { UserDto } from '@repo/api';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import type { AuthClaims } from '../../auth/auth-context';
import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { toUserDto } from '../dto/user-output';
import { createUserSyncedFromAuthEvent } from '../events/user-synced-from-auth.event';
import { UserProjector } from '../projectors/user-projector';
import { SyncUserFromAuthCommand } from './sync-user-from-auth.command';

@CommandHandler(SyncUserFromAuthCommand)
export class SyncUserFromAuthHandler
  implements ICommandHandler<SyncUserFromAuthCommand, UserDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly userProjector: UserProjector,
  ) {}

  async execute(command: SyncUserFromAuthCommand): Promise<UserDto> {
    const event = createUserSyncedFromAuthEvent({
      userId: command.userId,
      authUserId: this.readStringClaim(command.claims, 'sub'),
      email: this.readStringClaim(command.claims, 'email'),
      emailVerified:
        this.readBooleanClaim(command.claims, 'email_verified') ?? false,
      name:
        this.readStringClaim(command.claims, 'name') ??
        this.readStringClaim(command.claims, 'email') ??
        '',
      firstName: this.readStringClaim(command.claims, 'first_name'),
      lastName: this.readStringClaim(command.claims, 'last_name'),
      imageUrl: this.readStringClaim(command.claims, 'image_url'),
      role: this.readStringClaim(command.claims, 'role') ?? 'user',
    });

    const user = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.userProjector.projectSyncedFromAuth(event.payload, manager),
    );

    return toUserDto(user);
  }

  private readStringClaim(
    claims: AuthClaims,
    key: keyof AuthClaims,
  ): string | null {
    const value = claims[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private readBooleanClaim(
    claims: AuthClaims,
    key: keyof AuthClaims,
  ): boolean | null {
    const value = claims[key];
    return typeof value === 'boolean' ? value : null;
  }
}
