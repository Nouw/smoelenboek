import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DataSource, QueryRunner } from 'typeorm';

import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreateBetterAuthTables1767200000000 } from '../src/database/migrations/1767200000000-CreateBetterAuthTables';
import { FixBetterAuthIdDefaults1767300000000 } from '../src/database/migrations/1767300000000-FixBetterAuthIdDefaults';
import { AddBetterAuthAdminFields1767800000000 } from '../src/database/migrations/1767800000000-AddBetterAuthAdminFields';
import { CreateUserInformation1768000000000 } from '../src/database/migrations/1768000000000-CreateUserInformation';
import { AddLegacyUserMigration1768100000000 } from '../src/database/migrations/1768100000000-AddLegacyUserMigration';

const databaseUrl = process.env.TEST_LEGACY_USER_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const scriptsDirectory = resolve(
  __dirname,
  '../src/../scripts/legacy-user-migration',
);

describeWithDatabase('legacy user migration PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeAll(async () => {
    if (!databaseUrl) {
      throw new Error('TEST_LEGACY_USER_DATABASE_URL is required.');
    }

    dataSource = new DataSource({ type: 'postgres', url: databaseUrl });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.startTransaction();
  });

  afterAll(async () => {
    if (runner) {
      if (runner.isTransactionActive) {
        await runner.rollbackTransaction();
      }
      await runner.release();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('maps identities, preserves modern credentials, and imports bcrypt users', async () => {
    for (const migration of [
      new CreateUsers1766810000000(),
      new CreateBetterAuthTables1767200000000(),
      new FixBetterAuthIdDefaults1767300000000(),
      new AddBetterAuthAdminFields1767800000000(),
      new CreateUserInformation1768000000000(),
      new AddLegacyUserMigration1768100000000(),
    ]) {
      await migration.up(runner);
    }

    const existingUserId = '11111111-1111-4111-8111-111111111111';
    await runner.query(
      `INSERT INTO users
        (id, "authUserId", email, "emailVerified", name, "createdAt", "updatedAt")
       VALUES ($1::uuid, $1::text, 'existing@example.com', true, 'Existing', now(), now())`,
      [existingUserId],
    );
    await runner.query(
      `INSERT INTO account
        (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1::text, 'credential', $1::uuid, 'scrypt:keep-me', now(), now())`,
      [existingUserId],
    );

    await runner.query(
      await readFile(
        resolve(scriptsDirectory, '01-create-staging.sql'),
        'utf8',
      ),
    );
    await runner.query(
      `INSERT INTO legacy_user_import_staging
        ("legacyUserId", email, "passwordHash", "firstName", "lastName",
         city, "bankAccountNumber", "birthDate", "bondNumber", "joinDate",
         "backNumber", role)
       VALUES
        (7, 'EXISTING@example.com', '$2b$10$legacy-existing', 'Existing', 'Member',
         'Utrecht', 'NL00EXISTING', '1990-01-01', 'BOND7', '2010-09-01', '7', 'admin'),
        (8, 'new@example.com', '$2b$10$legacy-new', 'New', 'Member',
         'Zeist', 'NL00NEW', '2000-02-02', 'BOND8', '2020-09-01', '8', 'user')`,
    );

    await runner.query(
      await readFile(resolve(scriptsDirectory, '03-migrate.sql'), 'utf8'),
    );

    const maps = await runner.query(
      `SELECT "legacyUserId"::int, "userId"
       FROM legacy_user_migration_map ORDER BY "legacyUserId"`,
    );
    expect(maps).toHaveLength(2);
    expect(maps[0]).toEqual({ legacyUserId: 7, userId: existingUserId });

    const [existingCredential] = await runner.query(
      `SELECT password FROM account
       WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [existingUserId],
    );
    expect(existingCredential.password).toBe('scrypt:keep-me');

    const [newUser] = await runner.query(
      `SELECT u.id, u."passwordMigrationRequired", a.password, i.city,
              i."bankAccountNumber"
       FROM legacy_user_migration_map m
       JOIN users u ON u.id = m."userId"
       JOIN account a ON a."userId" = u.id AND a."providerId" = 'credential'
       JOIN user_information i ON i."userId" = u.id
       WHERE m."legacyUserId" = 8`,
    );
    expect(newUser).toMatchObject({
      passwordMigrationRequired: true,
      password: '$2b$10$legacy-new',
      city: 'Zeist',
      bankAccountNumber: 'NL00NEW',
    });
    expect(newUser.id).toMatch(/^[0-9a-f-]{36}$/);

    const [existingUser] = await runner.query(
      `SELECT "passwordMigrationRequired", role FROM users WHERE id = $1`,
      [existingUserId],
    );
    expect(existingUser).toEqual({
      passwordMigrationRequired: false,
      role: 'admin',
    });
  });
});
