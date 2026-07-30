import type { UserSummaryDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toUserSummaryDto } from '../dto/user-output';
import { UsersRepository } from '../repositories/users.repository';
import { SearchUsersQuery } from './search-users.query';

@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler
  implements IQueryHandler<SearchUsersQuery, UserSummaryDto[]>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(query: SearchUsersQuery): Promise<UserSummaryDto[]> {
    const users = await this.usersRepository.search(query.query, 20);

    return users.map(toUserSummaryDto);
  }
}
