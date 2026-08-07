import type { UserSummaryDto } from '@repo/api';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toUserSummaryDto } from '../dto/user-output';
import { UsersRepository } from '../repositories/users.repository';
import { SearchUsersQuery } from './search-users.query';

@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler
  implements IQueryHandler<SearchUsersQuery, UserSummaryDto[]>
{
  private readonly logger = new Logger(SearchUsersHandler.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(query: SearchUsersQuery): Promise<UserSummaryDto[]> {
    const users = await this.usersRepository.search(query.query, 20);
    const results = users.map(toUserSummaryDto);

    this.logger.debug({
      event: 'users_searched',
      queryLength: query.query.length,
      resultCount: results.length,
    });

    return results;
  }
}
