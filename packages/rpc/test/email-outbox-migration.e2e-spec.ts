import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreateBetterAuthTables1767200000000 } from '../src/database/migrations/1767200000000-CreateBetterAuthTables';
import { CreateEmailOutboxAndUserInvitations1769000000000 } from '../src/database/migrations/1769000000000-CreateEmailOutboxAndUserInvitations';

const databaseUrl = process.env.TEST_USER_INFORMATION_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('email outbox migration PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;
  beforeAll(async () => {
    if (!databaseUrl) throw new Error('TEST_USER_INFORMATION_DATABASE_URL is required.');
    dataSource = new DataSource({ type: 'postgres', url: databaseUrl });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.startTransaction();
  });
  afterAll(async () => {
    if (runner) { await runner.rollbackTransaction(); await runner.release(); }
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('backfills existing activation and enforces localized durable delivery', async () => {
    await new CreateUsers1766810000000().up(runner);
    await new CreateBetterAuthTables1767200000000().up(runner);
    const userId = '11111111-1111-4111-8111-111111111111';
    await runner.query(`INSERT INTO "users" ("id", "email", "name") VALUES ($1, 'member@example.com', 'Member')`, [userId]);
    await new CreateEmailOutboxAndUserInvitations1769000000000().up(runner);
    const [user] = await runner.query(`SELECT "preferredLocale", "createdAt", "accountActivatedAt" FROM "users" WHERE "id" = $1`, [userId]);
    expect(user.preferredLocale).toBe('nl');
    expect(user.accountActivatedAt).toEqual(user.createdAt);
    await runner.query(`INSERT INTO "email_outbox" ("messageType", "recipient", "locale", "payload", "relatedUserId", "deduplicationKey") VALUES ('invitation', 'member@example.com', 'en', '{}', $1, 'invite:1')`, [userId]);
    const [outbox] = await runner.query(`SELECT "status", "attempts" FROM "email_outbox" WHERE "deduplicationKey" = 'invite:1'`);
    expect(outbox).toEqual({ status: 'pending', attempts: 0 });
    await runner.query('SAVEPOINT invalid_locale');
    await expect(runner.query(`UPDATE "email_outbox" SET "locale" = 'fr' WHERE "deduplicationKey" = 'invite:1'`)).rejects.toMatchObject({ constraint: 'CHK_email_outbox_locale' });
    await runner.query('ROLLBACK TO SAVEPOINT invalid_locale');
  });
});
