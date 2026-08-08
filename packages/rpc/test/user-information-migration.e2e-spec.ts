import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { DataSource, QueryRunner } from 'typeorm';

import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreateUserInformation1768000000000 } from '../src/database/migrations/1768000000000-CreateUserInformation';
import { NormalizeMissingBondNumbers1768200000000 } from '../src/database/migrations/1768200000000-NormalizeMissingBondNumbers';
import { DropUserInformationJoinDate1769200000000 } from '../src/database/migrations/1769200000000-DropUserInformationJoinDate';

const databaseUrl = process.env.TEST_USER_INFORMATION_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('user information migration PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeAll(async () => {
    if (!databaseUrl) {
      throw new Error('TEST_USER_INFORMATION_DATABASE_URL is required.');
    }

    dataSource = new DataSource({ type: 'postgres', url: databaseUrl });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.startTransaction();
  });

  afterAll(async () => {
    if (runner) {
      await runner.rollbackTransaction();
      await runner.release();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('enforces one-to-one information and cascades user deletion', async () => {
    await new CreateUsers1766810000000().up(runner);
    await new CreateUserInformation1768000000000().up(runner);

    const userId = '11111111-1111-4111-8111-111111111111';
    const secondUserId = '22222222-2222-4222-8222-222222222222';
    const thirdUserId = '33333333-3333-4333-8333-333333333333';
    await runner.query(
      `INSERT INTO "users" ("id", "clerkUserId")
       VALUES ($1, $2), ($3, $4), ($5, $6)`,
      [
        userId,
        'information-test-user',
        secondUserId,
        'information-second-test-user',
        thirdUserId,
        'information-third-test-user',
      ],
    );
    await runner.query(
      `INSERT INTO "user_information"
        ("userId", "city", "bankAccountNumber", "bondNumber", "joinDate", "backNumber")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'Utrecht', 'NL00TEST0123456789', 'ABC123', '2019-09-06', 8],
    );

    const [row] = await runner.query(
      `SELECT "userId", "city", "bankAccountNumber", "bondNumber", "backNumber"
       FROM "user_information" WHERE "userId" = $1`,
      [userId],
    );
    const constraints = await runner.query(
      `SELECT "conname" FROM "pg_constraint"
       WHERE "conname" IN (
         'PK_user_information_userId',
         'UQ_user_information_bondNumber',
         'CHK_user_information_membership_dates',
         'CHK_user_information_backNumber',
         'FK_user_information_user'
       )`,
    );

    expect(row).toMatchObject({
      userId,
      city: 'Utrecht',
      bankAccountNumber: 'NL00TEST0123456789',
      bondNumber: 'ABC123',
      backNumber: 8,
    });
    expect(constraints).toHaveLength(5);

    await expectConstraintViolation(
      runner,
      'INSERT INTO "user_information" ("userId") VALUES ($1)',
      [userId],
      'PK_user_information_userId',
    );
    await expectConstraintViolation(
      runner,
      'INSERT INTO "user_information" ("userId", "bondNumber") VALUES ($1, $2)',
      [secondUserId, 'ABC123'],
      'UQ_user_information_bondNumber',
    );
    await expectConstraintViolation(
      runner,
      `INSERT INTO "user_information"
        ("userId", "joinDate", "leaveDate") VALUES ($1, $2, $3)`,
      [secondUserId, '2025-09-01', '2025-08-31'],
      'CHK_user_information_membership_dates',
    );
    await expectConstraintViolation(
      runner,
      'INSERT INTO "user_information" ("userId", "backNumber") VALUES ($1, $2)',
      [secondUserId, -1],
      'CHK_user_information_backNumber',
    );

    await runner.query(
      'INSERT INTO "user_information" ("userId", "bondNumber") VALUES ($1, $2)',
      [secondUserId, '-'],
    );
    await new NormalizeMissingBondNumbers1768200000000().up(runner);
    await runner.query(
      'INSERT INTO "user_information" ("userId", "bondNumber") VALUES ($1, NULL)',
      [thirdUserId],
    );

    const missingBondNumbers = await runner.query(
      `SELECT "bondNumber" FROM "user_information"
       WHERE "userId" IN ($1, $2) ORDER BY "userId"`,
      [secondUserId, thirdUserId],
    );
    expect(missingBondNumbers).toEqual([
      { bondNumber: null },
      { bondNumber: null },
    ]);

    await new DropUserInformationJoinDate1769200000000().up(runner);
    const columns = await runner.query(
      `SELECT "column_name" FROM "information_schema"."columns"
       WHERE "table_schema" = 'public' AND "table_name" = 'user_information'
         AND "column_name" IN ('joinDate', 'leaveDate')
       ORDER BY "column_name"`,
    );
    expect(columns).toEqual([{ column_name: 'leaveDate' }]);

    await runner.query('DELETE FROM "users" WHERE "id" = $1', [userId]);
    const [{ count }] = await runner.query(
      'SELECT COUNT(*)::int AS "count" FROM "user_information" WHERE "userId" = $1',
      [userId],
    );
    expect(count).toBe(0);
  });
});

async function expectConstraintViolation(
  runner: QueryRunner,
  statement: string,
  parameters: unknown[],
  constraint: string,
): Promise<void> {
  await runner.query('SAVEPOINT user_information_constraint_check');

  try {
    await runner.query(statement, parameters);
    throw new Error(`Expected constraint ${constraint} to reject the query.`);
  } catch (error) {
    expect(error).toMatchObject({ constraint });
  } finally {
    await runner.query(
      'ROLLBACK TO SAVEPOINT user_information_constraint_check',
    );
    await runner.query('RELEASE SAVEPOINT user_information_constraint_check');
  }
}
