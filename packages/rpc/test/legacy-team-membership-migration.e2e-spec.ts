import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DataSource, QueryRunner } from 'typeorm';

import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreateStoredEvents1766900000000 } from '../src/database/migrations/1766900000000-CreateStoredEvents';
import { CreateSeasons1767000000000 } from '../src/database/migrations/1767000000000-CreateSeasons';
import { CreateTeamsCommitteesMemberships1767100000000 } from '../src/database/migrations/1767100000000-CreateTeamsCommitteesMemberships';
import { AddTeamImageUrl1767600000000 } from '../src/database/migrations/1767600000000-AddTeamImageUrl';
import { ReplaceSeasonsWithSeasonKeys1767900000000 } from '../src/database/migrations/1767900000000-ReplaceSeasonsWithSeasonKeys';
import { AddLegacyTeamMembershipMigration1768300000000 } from '../src/database/migrations/1768300000000-AddLegacyTeamMembershipMigration';

const databaseUrl = process.env.TEST_LEGACY_TEAM_MEMBERSHIP_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const scriptsDirectory = resolve(
  __dirname,
  '../scripts/legacy-team-membership-migration',
);

describeWithDatabase('legacy team membership PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeAll(async () => {
    if (!databaseUrl) {
      throw new Error('TEST_LEGACY_TEAM_MEMBERSHIP_DATABASE_URL is required.');
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

  it('maps users, teams, roles, and legacy season starts', async () => {
    for (const migration of [
      new CreateUsers1766810000000(),
      new CreateStoredEvents1766900000000(),
      new CreateSeasons1767000000000(),
      new CreateTeamsCommitteesMemberships1767100000000(),
      new AddTeamImageUrl1767600000000(),
      new ReplaceSeasonsWithSeasonKeys1767900000000(),
      new AddLegacyTeamMembershipMigration1768300000000(),
    ]) {
      await migration.up(runner);
    }

    const [legacyUserMap] = await runner.query(
      `SELECT to_regclass('legacy_user_migration_map') AS relation`,
    );
    expect(legacyUserMap).toEqual({ relation: null });

    const firstUserId = '11111111-1111-4111-8111-111111111111';
    const secondUserId = '22222222-2222-4222-8222-222222222222';
    await runner.query(
      `INSERT INTO users (id, "clerkUserId", email)
       VALUES
         ($1, 'legacy-team-user-1', 'first@example.com'),
         ($2, 'legacy-team-user-2', 'second@example.com')`,
      [firstUserId, secondUserId],
    );

    const existingMembershipId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const [{ id: herenOneId }] = await runner.query(
      `SELECT id FROM teams WHERE name = 'Heren 1'`,
    );
    await runner.query(
      `INSERT INTO team_memberships (
        id, "userId", "teamId", "seasonKey", role, "startedOn",
        "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, 2023, 'coach_trainer', '2023-08-01',
                 '2023-08-03T10:00:00Z', '2023-08-03T10:00:00Z')`,
      [existingMembershipId, firstUserId, herenOneId],
    );
    await runner.query(
      `INSERT INTO stored_events (
        "aggregateType", "aggregateId", "eventType", "eventVersion",
        payload, metadata, "occurredAt"
       ) VALUES (
        'team_membership', $1::text, 'team.member_assigned', 2,
        jsonb_build_object(
          'membershipId', $1::text,
          'userId', $2::text,
          'teamId', $3::text,
          'seasonKey', 2023,
          'role', 'coach_trainer',
          'startedOn', '2023-08-01',
          'endedOn', NULL
        ),
        '{"source":"manual"}'::jsonb,
        '2023-08-03T10:00:00Z'
       )`,
      [existingMembershipId, firstUserId, herenOneId],
    );

    await runner.query(`
      CREATE TABLE legacy_team_membership_import_staging (
        "legacyMembershipId" bigint,
        "legacyUserId" bigint,
        "legacyTeamId" bigint,
        "teamName" text,
        "legacySeasonId" bigint,
        "seasonStartsOn" date,
        "legacyFunction" text
      )
    `);
    await runner.query(
      await readFile(
        resolve(scriptsDirectory, '01-create-staging.sql'),
        'utf8',
      ),
    );
    await runner.query(`
      INSERT INTO legacy_team_membership_import_staging (
        "legacyMembershipId", "legacyUserId", email, "legacyTeamId",
        "teamName", "legacySeasonId", "seasonStartsOn", "legacyFunction"
      )
      VALUES
        (101, 7, 'FIRST@example.com', 1, 'Heren 1', 20, '2023-08-01', 'Coach / Trainer'),
        (102, 7, 'first@example.com', 1, 'Heren 1', 21, '2024-08-15', 'Outside hitter'),
        (103, 8, 'second@example.com', 8, 'Dames 1', 21, '2024-08-01', 'Setter')
    `);

    await runner.query(
      await readFile(resolve(scriptsDirectory, '02-preflight.sql'), 'utf8'),
    );
    await runner.query(
      await readFile(resolve(scriptsDirectory, '03-migrate.sql'), 'utf8'),
    );
    await runner.query(
      await readFile(resolve(scriptsDirectory, '04-report.sql'), 'utf8'),
    );

    const teamMaps = await runner.query(
      `SELECT "legacyTeamId"::int, team.name
       FROM legacy_team_migration_map map
       JOIN teams team ON team.id = map."teamId"
       ORDER BY "legacyTeamId"`,
    );
    expect(teamMaps).toEqual([
      { legacyTeamId: 1, name: 'Heren 1' },
      { legacyTeamId: 8, name: 'Dames 1' },
    ]);

    const memberships = await runner.query(
      `SELECT map."legacyMembershipId"::int, membership."userId",
              team.name AS "teamName", membership."seasonKey"::int,
              membership.role, membership."startedOn"::text,
              membership."endedOn",
              (membership."createdAt" AT TIME ZONE 'Europe/Amsterdam')::date::text
                AS "createdOn"
       FROM legacy_team_membership_migration_map map
       JOIN team_memberships membership ON membership.id = map."membershipId"
       JOIN teams team ON team.id = membership."teamId"
       ORDER BY map."legacyMembershipId"`,
    );
    expect(memberships).toEqual([
      {
        legacyMembershipId: 101,
        userId: firstUserId,
        teamName: 'Heren 1',
        seasonKey: 2023,
        role: 'coach_trainer',
        startedOn: '2023-08-01',
        endedOn: null,
        createdOn: '2023-08-03',
      },
      {
        legacyMembershipId: 102,
        userId: firstUserId,
        teamName: 'Heren 1',
        seasonKey: 2024,
        role: 'outside_hitter',
        startedOn: '2024-08-15',
        endedOn: null,
        createdOn: '2024-08-16',
      },
      {
        legacyMembershipId: 103,
        userId: secondUserId,
        teamName: 'Dames 1',
        seasonKey: 2024,
        role: 'setter',
        startedOn: '2024-08-01',
        endedOn: null,
        createdOn: '2024-08-02',
      },
    ]);

    const events = await runner.query(
      `SELECT map."legacyMembershipId"::int,
              "eventVersion", payload->>'seasonKey' AS "seasonKey",
              payload->>'role' AS role,
              ("occurredAt" AT TIME ZONE 'Europe/Amsterdam')::date::text
                AS "occurredOn"
       FROM legacy_team_membership_migration_map map
       JOIN stored_events event
         ON event."aggregateId" = map."membershipId"::text
        AND event."aggregateType" = 'team_membership'
        AND event."eventType" = 'team.member_assigned'
       ORDER BY map."legacyMembershipId"`,
    );
    expect(events).toEqual([
      {
        legacyMembershipId: 101,
        eventVersion: 2,
        seasonKey: '2023',
        role: 'coach_trainer',
        occurredOn: '2023-08-03',
      },
      {
        legacyMembershipId: 102,
        eventVersion: 2,
        seasonKey: '2024',
        role: 'outside_hitter',
        occurredOn: '2024-08-16',
      },
      {
        legacyMembershipId: 103,
        eventVersion: 2,
        seasonKey: '2024',
        role: 'setter',
        occurredOn: '2024-08-02',
      },
    ]);
  });
});
