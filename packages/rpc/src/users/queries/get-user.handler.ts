import type { UserDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toUserDto } from '../dto/user-output';
import { UsersRepository } from '../repositories/users.repository';
import { GetUserQuery } from './get-user.query';

@QueryHandler(GetUserQuery)
export class GetUserHandler
  implements IQueryHandler<GetUserQuery, UserDto | null>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(query: GetUserQuery): Promise<UserDto | null> {
    const user = await this.usersRepository.findById(query.userId);

    return user ? toUserDto(user) : null;
  }
}
