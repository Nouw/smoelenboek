import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersBirthdaysQuery } from './users-birthdays.query';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { toUserBirthdaysDto } from '../dto/users-birthdays-output';

@QueryHandler(UsersBirthdaysQuery)
export class UsersBirthdaysHandler
  implements IQueryHandler<UsersBirthdaysQuery, { id: string, name: string, birthDate: string}[]>
{
  private readonly logger = new Logger(UsersBirthdaysHandler.name);

  constructor(
    private readonly dataSource: DataSource) {
  }
  async execute(_query: UsersBirthdaysQuery): Promise<{ id: string, name: string, birthDate: string }[]> {
    const rows: { id: string, name: string, birthDate: Date }[] = await this.dataSource.query(
      `SELECT u."id", u."name", ui."birthDate" FROM "user_information" ui
INNER JOIN "users" u on u.id = ui."userId" WHERE ui."leaveDate" is NULL AND ui."birthDate" IS NOT NULL`)
    this.logger.debug(rows[0]);
    return rows.map((row) => toUserBirthdaysDto(row));
  }
}
