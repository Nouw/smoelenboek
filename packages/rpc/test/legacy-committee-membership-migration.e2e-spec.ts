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
import { AddLegacyCommitteeMembershipMigration1768400000000 } from '../src/database/migrations/1768400000000-AddLegacyCommitteeMembershipMigration';

const databaseUrl = process.env.TEST_LEGACY_COMMITTEE_MEMBERSHIP_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const scriptsDirectory = resolve(
  __dirname,
  '../scripts/legacy-committee-membership-migration',
);

describeWithDatabase('legacy committee membership PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeAll(async () => {
    if (!databaseUrl) {
      throw new Error(
        'TEST_LEGACY_COMMITTEE_MEMBERSHIP_DATABASE_URL is required.',
      );
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

  it('maps users, committees, roles, and legacy season starts', async () => {
    for (const migration of [
      new CreateUsers1766810000000(),
      new CreateStoredEvents1766900000000(),
      new CreateSeasons1767000000000(),
      new CreateTeamsCommitteesMemberships1767100000000(),
      new AddTeamImageUrl1767600000000(),
      new ReplaceSeasonsWithSeasonKeys1767900000000(),
      new AddLegacyCommitteeMembershipMigration1768400000000(),
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
         ($1, 'legacy-committee-user-1', 'first@example.com'),
         ($2, 'legacy-committee-user-2', 'second@example.com')`,
      [firstUserId, secondUserId],
    );

    const existingMembershipId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const [{ id: bestuurId }] = await runner.query(
      `SELECT id FROM committees WHERE name = 'Bestuur'`,
    );
    await runner.query(
      `INSERT INTO committee_memberships (
        id, "userId", "committeeId", "seasonKey", role, "startedOn",
        "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, 2023, 'voorzitter', '2023-08-01',
                 '2023-08-03T10:00:00Z', '2023-08-03T10:00:00Z')`,
      [existingMembershipId, firstUserId, bestuurId],
    );
    await runner.query(
      `INSERT INTO stored_events (
        "aggregateType", "aggregateId", "eventType", "eventVersion",
        payload, metadata, "occurredAt"
       ) VALUES (
        'committee_membership', $1::text, 'committee.member_assigned', 2,
        jsonb_build_object(
          'membershipId', $1::text,
          'userId', $2::text,
          'committeeId', $3::text,
          'seasonKey', 2023,
          'role', 'voorzitter',
          'startedOn', '2023-08-01',
          'endedOn', NULL
        ),
        '{"source":"manual"}'::jsonb,
        '2023-08-03T10:00:00Z'
       )`,
      [existingMembershipId, firstUserId, bestuurId],
    );

    await runner.query(`
      CREATE TABLE legacy_committee_membership_import_staging (
        "legacyMembershipId" bigint,
        "legacyUserId" bigint,
        "legacyCommitteeId" bigint,
        "committeeName" text,
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
      INSERT INTO legacy_committee_membership_import_staging (
        "legacyMembershipId", "legacyUserId", email, "legacyCommitteeId",
        "committeeName", "legacySeasonId", "seasonStartsOn", "legacyFunction"
      )
      VALUES
        (101, 7, 'FIRST@example.com', 1, 'Bestuur', 20, '2023-08-01', 'Voorzitter'),
        (102, 7, 'first@example.com', 1, 'Bestuur', 21, '2024-08-15', 'Commissaris Arbitrage en Zaalwacht'),
        (103, 8, 'second@example.com', 3, 'Webcommissie', 21, '2024-08-01', 'Secretaris')
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

    const committeeMaps = await runner.query(
      `SELECT "legacyCommitteeId"::int, committee.name
       FROM legacy_committee_migration_map map
       JOIN committees committee ON committee.id = map."committeeId"
       ORDER BY "legacyCommitteeId"`,
    );
    expect(committeeMaps).toEqual([
      { legacyCommitteeId: 1, name: 'Bestuur' },
      { legacyCommitteeId: 3, name: 'Webcommissie' },
    ]);

    const memberships = await runner.query(
      `SELECT map."legacyMembershipId"::int, membership."userId",
              committee.name AS "committeeName", membership."seasonKey"::int,
              membership.role, membership."startedOn"::text,
              membership."endedOn",
              (membership."createdAt" AT TIME ZONE 'Europe/Amsterdam')::date::text
                AS "createdOn"
       FROM legacy_committee_membership_migration_map map
       JOIN committee_memberships membership ON membership.id = map."membershipId"
       JOIN committees committee ON committee.id = membership."committeeId"
       ORDER BY map."legacyMembershipId"`,
    );
    expect(memberships).toEqual([
      {
        legacyMembershipId: 101,
        userId: firstUserId,
        committeeName: 'Bestuur',
        seasonKey: 2023,
        role: 'voorzitter',
        startedOn: '2023-08-01',
        endedOn: null,
        createdOn: '2023-08-03',
      },
      {
        legacyMembershipId: 102,
        userId: firstUserId,
        committeeName: 'Bestuur',
        seasonKey: 2024,
        role: 'commissaris_zaalwacht_en_arbitrage',
        startedOn: '2024-08-15',
        endedOn: null,
        createdOn: '2024-08-16',
      },
      {
        legacyMembershipId: 103,
        userId: secondUserId,
        committeeName: 'Webcommissie',
        seasonKey: 2024,
        role: 'secretaris',
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
       FROM legacy_committee_membership_migration_map map
       JOIN stored_events event
         ON event."aggregateId" = map."membershipId"::text
        AND event."aggregateType" = 'committee_membership'
        AND event."eventType" = 'committee.member_assigned'
       ORDER BY map."legacyMembershipId"`,
    );
    expect(events).toEqual([
      {
        legacyMembershipId: 101,
        eventVersion: 2,
        seasonKey: '2023',
        role: 'voorzitter',
        occurredOn: '2023-08-03',
      },
      {
        legacyMembershipId: 102,
        eventVersion: 2,
        seasonKey: '2024',
        role: 'commissaris_zaalwacht_en_arbitrage',
        occurredOn: '2024-08-16',
      },
      {
        legacyMembershipId: 103,
        eventVersion: 2,
        seasonKey: '2024',
        role: 'secretaris',
        occurredOn: '2024-08-02',
      },
    ]);
  });
});
