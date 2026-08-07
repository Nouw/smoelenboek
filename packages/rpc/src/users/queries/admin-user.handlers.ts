import type { ManagedUserDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ListManagedUsersQuery } from './admin-user.queries';

@QueryHandler(ListManagedUsersQuery)
export class ListManagedUsersHandler implements IQueryHandler<ListManagedUsersQuery, ManagedUserDto[]> {
  constructor(private readonly dataSource: DataSource) {}
  async execute(query: ListManagedUsersQuery): Promise<ManagedUserDto[]> {
    const rows = await this.dataSource.query(
      `SELECT u."id", u."email", u."name", u."preferredLocale", u."invitedAt", u."accountActivatedAt",
        CASE WHEN u."accountActivatedAt" IS NOT NULL THEN 'active'
          WHEN eo."status" IS NULL THEN 'not_queued' ELSE eo."status" END AS "invitationStatus"
       FROM "users" u LEFT JOIN LATERAL (SELECT "status" FROM "email_outbox" WHERE "relatedUserId" = u."id" AND "messageType" = 'invitation' ORDER BY "createdAt" DESC LIMIT 1) eo ON true
       WHERE ($1 = '' OR u."name" ILIKE '%' || $1 || '%' OR u."email" ILIKE '%' || $1 || '%')
       ORDER BY u."name" ASC LIMIT $2 OFFSET $3`, [query.query, query.limit, query.offset]);
    return rows.map((row: Record<string, unknown>) => ({ ...row, invitedAt: row.invitedAt instanceof Date ? row.invitedAt.toISOString() : row.invitedAt, accountActivatedAt: row.accountActivatedAt instanceof Date ? row.accountActivatedAt.toISOString() : row.accountActivatedAt })) as ManagedUserDto[];
  }
}
