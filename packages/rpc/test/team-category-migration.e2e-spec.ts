import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { DataSource, QueryRunner } from 'typeorm';

import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreateStoredEvents1766900000000 } from '../src/database/migrations/1766900000000-CreateStoredEvents';
import { CreateSeasons1767000000000 } from '../src/database/migrations/1767000000000-CreateSeasons';
import { CreateTeamsCommitteesMemberships1767100000000 } from '../src/database/migrations/1767100000000-CreateTeamsCommitteesMemberships';
import { AddTeamCategory1768800000000 } from '../src/database/migrations/1768800000000-AddTeamCategory';

const databaseUrl = process.env.TEST_TEAM_CATEGORY_MIGRATION_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('team category migration PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeEach(async () => {
    if (!databaseUrl) {
      throw new Error('TEST_TEAM_CATEGORY_MIGRATION_DATABASE_URL is required.');
    }
    dataSource = new DataSource({ type: 'postgres', url: databaseUrl });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.startTransaction();

    for (const migration of [
      new CreateUsers1766810000000(),
      new CreateStoredEvents1766900000000(),
      new CreateSeasons1767000000000(),
      new CreateTeamsCommitteesMemberships1767100000000(),
    ]) {
      await migration.up(runner);
    }
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

  it('backfills rows and their historical snapshot events', async () => {
    const [{ id: teamId }] = await runner.query(
      'SELECT "id" FROM "teams" WHERE "name" = $1',
      ['Dames 1'],
    );
    await runner.query(
      `INSERT INTO "stored_events"
        ("aggregateType", "aggregateId", "eventType", "eventVersion", "payload", "metadata")
       VALUES ('team', $1, 'team.created', 1, $2::jsonb, '{}'::jsonb)`,
      [teamId, JSON.stringify({ teamId, name: 'Dames 1', archivedAt: null })],
    );

    await new AddTeamCategory1768800000000().up(runner);

    const [team] = await runner.query(
      'SELECT "category" FROM "teams" WHERE "id" = $1',
      [teamId],
    );
    const [event] = await runner.query(
      'SELECT "eventVersion", "payload" FROM "stored_events" WHERE "aggregateId" = $1',
      [teamId],
    );
    expect(team.category).toBe('women');
    expect(event).toMatchObject({
      eventVersion: 2,
      payload: expect.objectContaining({ category: 'women' }),
    });

    await expect(
      runner.query('INSERT INTO "teams" ("name", "category") VALUES ($1, $2)', [
        'Invalid category',
        'mixed',
      ]),
    ).rejects.toThrow();
  });

  it('fails instead of silently classifying an unknown team name', async () => {
    await runner.query('INSERT INTO "teams" ("name") VALUES ($1)', [
      'Recreanten 1',
    ]);

    await expect(new AddTeamCategory1768800000000().up(runner)).rejects.toThrow(
      'Cannot classify',
    );
  });
});
