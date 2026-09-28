import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersJoinedQuery } from './users-joined.query';
import { DataSource } from 'typeorm';
import { toUsersJoinedDto } from '../dto/users-joined-output';

@QueryHandler(UsersJoinedQuery)
export class UsersJoinedHandler implements IQueryHandler<UsersJoinedQuery> {
  constructor(private readonly datasource: DataSource) {
  }
  // TODO: Update the return type
  async execute(query: UsersJoinedQuery): Promise<any> {
    const rows: { id: string, name: string, createdAt: Date }[] = await this.datasource.query(
      `SELECT u.id, u.name, u."createdAt" FROM user_information ui INNER JOIN public.users u on u.id = ui."userId" WHERE ui."leaveDate" IS NULL ORDER BY u."createdAt" `,
    );


    return rows.map((row) => toUsersJoinedDto(row))
  }
}
