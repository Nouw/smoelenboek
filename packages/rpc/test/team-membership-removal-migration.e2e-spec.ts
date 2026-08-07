import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { DataSource, QueryRunner } from 'typeorm';

import { RemoveEndedTeamMemberships1768900000000 } from '../src/database/migrations/1768900000000-RemoveEndedTeamMemberships';

const databaseUrl = process.env.TEST_TEAM_REMOVAL_MIGRATION_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('immediate team membership removal PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeEach(async () => {
    if (!databaseUrl) {
      throw new Error('TEST_TEAM_REMOVAL_MIGRATION_DATABASE_URL is required.');
    }
    dataSource = new DataSource({ type: 'postgres', url: databaseUrl });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.startTransaction();
    await runner.query(`
      CREATE TABLE "team_memberships" (
        "id" uuid PRIMARY KEY,
        "endedOn" date
      )
    `);
  });

  afterEach(async () => {
    if (runner) {
      await runner.rollbackTransaction();
      await runner.release();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('keeps current memberships and deletes legacy ended rows', async () => {
    await runner.query(
      `INSERT INTO "team_memberships" ("id", "endedOn")
       VALUES ($1, NULL), ($2, '2026-02-01')`,
      [
        '02ac256b-ce8f-44e9-8913-7569c3401264',
        'f7281536-b3d2-4d45-b0f0-888f48a18056',
      ],
    );

    await new RemoveEndedTeamMemberships1768900000000().up(runner);

    const rows = await runner.query(
      'SELECT "id" FROM "team_memberships" ORDER BY "id"',
    );
    expect(rows).toEqual([
      { id: '02ac256b-ce8f-44e9-8913-7569c3401264' },
    ]);
  });
});
