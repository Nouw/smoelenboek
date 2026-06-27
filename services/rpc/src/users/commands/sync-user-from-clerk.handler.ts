import type { UserDto } from '@repo/api';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { toUserDto } from '../dto/user-output';
import { UsersRepository } from '../repositories/users.repository';
import { SyncUserFromClerkCommand } from './sync-user-from-clerk.command';

@CommandHandler(SyncUserFromClerkCommand)
export class SyncUserFromClerkHandler
  implements ICommandHandler<SyncUserFromClerkCommand, UserDto>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: SyncUserFromClerkCommand): Promise<UserDto> {
    const user = await this.usersRepository.syncFromClerk({
      clerkUserId: command.clerkUserId,
      claims: command.claims,
    });

    return toUserDto(user);
  }
}
