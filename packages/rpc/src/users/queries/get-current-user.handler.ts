import type { UserDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toUserDto } from '../dto/user-output';
import { UsersRepository } from '../repositories/users.repository';
import { GetCurrentUserQuery } from './get-current-user.query';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler
  implements IQueryHandler<GetCurrentUserQuery, UserDto | null>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(query: GetCurrentUserQuery): Promise<UserDto | null> {
    const user = await this.usersRepository.findByClerkUserId(
      query.clerkUserId,
    );

    return user ? toUserDto(user) : null;
  }
}
