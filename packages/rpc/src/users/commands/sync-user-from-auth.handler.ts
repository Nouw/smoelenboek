import type { UserDto } from '@repo/api';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import type { AuthClaims } from '../../auth/auth-context';
import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { toUserDto } from '../dto/user-output';
import { UserSyncedFromAuthEvent } from '../events/user-synced-from-auth.event';
import { UsersRepository } from '../repositories/users.repository';
import { SyncUserFromAuthCommand } from './sync-user-from-auth.command';

@CommandHandler(SyncUserFromAuthCommand)
export class SyncUserFromAuthHandler
  implements ICommandHandler<SyncUserFromAuthCommand, UserDto>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(command: SyncUserFromAuthCommand): Promise<UserDto> {
    const event = UserSyncedFromAuthEvent.create({
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
    await this.eventStorePublisher.appendAndPublish(event);
    const user = await this.usersRepository.findById(command.userId);
    if (!user) throw new NotFoundException('User not found after sync.');
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
