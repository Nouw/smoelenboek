import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { hashSync } from 'bcryptjs';
import { DataSource, QueryRunner } from 'typeorm';

import {
  completePasswordMigration,
  verifyPasswordWithLegacySupport,
} from '../src/auth/legacy-password-migration';
import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreateBetterAuthTables1767200000000 } from '../src/database/migrations/1767200000000-CreateBetterAuthTables';
import { AddLegacyPasswordMigrationState1769700000000 } from '../src/database/migrations/1769700000000-AddLegacyPasswordMigrationState';
import { DropLegacyPasswordResetDeliveryState1769800000000 } from '../src/database/migrations/1769800000000-DropLegacyPasswordResetDeliveryState';

const databaseUrl = process.env.TEST_USER_INFORMATION_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('legacy password migration PostgreSQL fixture', () => {
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

  it('flags bcrypt credentials and clears the flag only after reset completion', async () => {
    await new CreateUsers1766810000000().up(runner);
    await new CreateBetterAuthTables1767200000000().up(runner);

    const userId = '11111111-1111-4111-8111-111111111111';
    const bcryptHash = hashSync('legacy-password', 4);
    await runner.query(
      `INSERT INTO "users" ("id", "email", "name") VALUES ($1, $2, $3)`,
      [userId, 'legacy@example.com', 'Legacy Member'],
    );
    await runner.query(
      `INSERT INTO "account" ("accountId", "providerId", "userId", "password") VALUES ($1, 'credential', $2, $3)`,
      ['legacy@example.com', userId, bcryptHash],
    );

    await new AddLegacyPasswordMigrationState1769700000000().up(runner);
    await new DropLegacyPasswordResetDeliveryState1769800000000().up(runner);

    const [flagged] = await runner.query(
      `SELECT "passwordMigrationRequired" FROM "users" WHERE "id" = $1`,
      [userId],
    );
    expect(flagged.passwordMigrationRequired).toBe(true);
    await expect(
      verifyPasswordWithLegacySupport(
        'legacy-password',
        bcryptHash,
        async () => false,
      ),
    ).resolves.toBe(true);

    const [duringLegacyAccess] = await runner.query(
      `SELECT "passwordMigrationRequired" FROM "users" WHERE "id" = $1`,
      [userId],
    );
    expect(duringLegacyAccess.passwordMigrationRequired).toBe(true);

    const modernHash = 'better-auth-scrypt-hash';
    await runner.query(
      `UPDATE "account" SET "password" = $2 WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [userId, modernHash],
    );
    await completePasswordMigration(runner as never, userId);

    const [migrated] = await runner.query(
      `SELECT "passwordMigrationRequired" FROM "users" WHERE "id" = $1`,
      [userId],
    );
    expect(migrated).toEqual({
      passwordMigrationRequired: false,
    });
    const verifyModern = async ({ hash }: { hash: string }) =>
      hash === modernHash;
    await expect(
      verifyPasswordWithLegacySupport(
        'new-password',
        modernHash,
        verifyModern as never,
      ),
    ).resolves.toBe(true);
  });

  it('also flags reset sentinels but leaves modern credentials active', async () => {
    const resetUserId = '22222222-2222-4222-8222-222222222222';
    const modernUserId = '33333333-3333-4333-8333-333333333333';
    await runner.query(
      `INSERT INTO "users" ("id", "email", "name") VALUES ($1, 'reset@example.com', 'Reset Member'), ($2, 'modern@example.com', 'Modern Member')`,
      [resetUserId, modernUserId],
    );
    await runner.query(
      `INSERT INTO "account" ("accountId", "providerId", "userId", "password") VALUES ('reset@example.com', 'credential', $1, 'reset'), ('modern@example.com', 'credential', $2, 'modern-hash')`,
      [resetUserId, modernUserId],
    );

    await new AddLegacyPasswordMigrationState1769700000000().up(runner);
    await new DropLegacyPasswordResetDeliveryState1769800000000().up(runner);

    const users = await runner.query(
      `SELECT "id", "passwordMigrationRequired" FROM "users" WHERE "id" IN ($1, $2) ORDER BY "id"`,
      [resetUserId, modernUserId],
    );
    expect(users).toEqual([
      { id: resetUserId, passwordMigrationRequired: true },
      { id: modernUserId, passwordMigrationRequired: false },
    ]);
  });
});
