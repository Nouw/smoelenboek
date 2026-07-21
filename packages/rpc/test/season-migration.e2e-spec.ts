import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { DataSource, QueryRunner } from 'typeorm';

import { CommitteeProjector } from '../src/committees/projectors/committee-projector';
import { CommitteeMembershipEntity } from '../src/committees/entities/committee-membership.entity';
import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreateStoredEvents1766900000000 } from '../src/database/migrations/1766900000000-CreateStoredEvents';
import { CreateSeasons1767000000000 } from '../src/database/migrations/1767000000000-CreateSeasons';
import { CreateTeamsCommitteesMemberships1767100000000 } from '../src/database/migrations/1767100000000-CreateTeamsCommitteesMemberships';
import { ReplaceSeasonsWithSeasonKeys1767900000000 } from '../src/database/migrations/1767900000000-ReplaceSeasonsWithSeasonKeys';
import { TeamMembershipEntity } from '../src/teams/entities/team-membership.entity';
import { TeamProjector } from '../src/teams/projectors/team-projector';

const databaseUrl = process.env.TEST_SEASON_MIGRATION_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('season migration PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeAll(async () => {
    if (!databaseUrl) {
      throw new Error('TEST_SEASON_MIGRATION_DATABASE_URL is required.');
    }

    dataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: [CommitteeMembershipEntity, TeamMembershipEntity],
    });
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

  it('backfills active rows, restores ended rows, and rewrites events', async () => {
    for (const migration of [
      new CreateUsers1766810000000(),
      new CreateStoredEvents1766900000000(),
      new CreateSeasons1767000000000(),
      new CreateTeamsCommitteesMemberships1767100000000(),
    ]) {
      await migration.up(runner);
    }

    const userId = '11111111-1111-4111-8111-111111111111';
    const seasonId = '22222222-2222-4222-8222-222222222222';
    const activeMembershipId = '33333333-3333-4333-8333-333333333333';
    const endedTeamMembershipId = '44444444-4444-4444-8444-444444444444';
    const endedCommitteeMembershipId = '55555555-5555-4555-8555-555555555555';
    const [{ id: teamId }] = await runner.query(
      'SELECT "id" FROM "teams" WHERE "name" = $1',
      ['Heren 1'],
    );
    const [{ id: committeeId }] = await runner.query(
      'SELECT "id" FROM "committees" WHERE "name" = $1',
      ['Bestuur'],
    );

    await runner.query(
      'INSERT INTO "users" ("id", "clerkUserId") VALUES ($1, $2)',
      [userId, 'history-test-user'],
    );
    await runner.query(
      'INSERT INTO "seasons" ("id", "name", "startsAt", "endsAt") VALUES ($1, $2, $3, $4)',
      [
        seasonId,
        '2024/2025',
        '2024-08-01T00:00:00.000Z',
        '2025-07-31T23:59:59.999Z',
      ],
    );
    await runner.query(
      `INSERT INTO "team_memberships"
        ("id", "userId", "teamId", "seasonId", "role")
       VALUES ($1, $2, $3, $4, $5)`,
      [activeMembershipId, userId, teamId, seasonId, 'libero'],
    );
    await insertEndedMembershipEvents(runner, {
      aggregateType: 'team_membership',
      membershipId: endedTeamMembershipId,
      assignedEventType: 'team.member_assigned',
      removedEventType: 'team.member_removed',
      assignedPayload: {
        membershipId: endedTeamMembershipId,
        userId,
        teamId,
        seasonId,
        role: 'setter',
      },
      removedAt: '2026-07-21T10:00:00.000Z',
    });
    await insertEndedMembershipEvents(runner, {
      aggregateType: 'committee_membership',
      membershipId: endedCommitteeMembershipId,
      assignedEventType: 'committee.member_assigned',
      removedEventType: 'committee.member_removed',
      assignedPayload: {
        membershipId: endedCommitteeMembershipId,
        userId,
        committeeId,
        seasonId,
        role: 'secretaris',
      },
      removedAt: '2025-01-15T10:00:00.000Z',
    });

    await new ReplaceSeasonsWithSeasonKeys1767900000000().up(runner);

    const teamRows = (await runner.query(
      `SELECT "id", "seasonKey", "startedOn", "endedOn"
       FROM "team_memberships" ORDER BY "id"`,
    )) as MigratedMembershipRow[];
    const [committeeRow] = (await runner.query(
      `SELECT "seasonKey", "startedOn", "endedOn"
       FROM "committee_memberships" WHERE "id" = $1`,
      [endedCommitteeMembershipId],
    )) as MigratedMembershipRow[];
    const assignedEvents = await runner.query(
      `SELECT "eventVersion", "payload" FROM "stored_events"
       WHERE "eventType" IN ('team.member_assigned', 'committee.member_assigned')`,
    );
    const membershipEvents = (await runner.query(
      `SELECT "aggregateType", "eventType", "eventVersion", "payload"
       FROM "stored_events"
       WHERE "aggregateId" IN ($1, $2)
       ORDER BY "sequence"`,
      [endedTeamMembershipId, endedCommitteeMembershipId],
    )) as MigratedEventRow[];
    const indexes = await runner.query(
      `SELECT "indexname" FROM "pg_indexes"
       WHERE "indexname" IN (
         'UQ_team_memberships_active_assignment',
         'UQ_committee_memberships_active_assignment',
         'IDX_team_memberships_active_season',
         'IDX_committee_memberships_active_season'
       )`,
    );
    const constraints = await runner.query(
      `SELECT "conname" FROM "pg_constraint"
       WHERE "conname" IN (
         'CHK_team_memberships_season_key',
         'CHK_team_memberships_dates',
         'CHK_committee_memberships_season_key',
         'CHK_committee_memberships_dates'
       )`,
    );
    const [{ seasonsTable }] = await runner.query(
      `SELECT to_regclass('public.seasons') AS "seasonsTable"`,
    );

    expect(teamRows).toHaveLength(2);
    expect(teamRows.find(({ id }) => id === activeMembershipId)).toMatchObject({
      seasonKey: 2024,
      endedOn: null,
    });
    const restoredTeam = teamRows.find(
      ({ id }) => id === endedTeamMembershipId,
    );
    expect(restoredTeam).toBeDefined();
    expect(committeeRow).toBeDefined();
    if (!restoredTeam || !committeeRow) {
      throw new Error('Expected restored membership rows.');
    }
    if (!restoredTeam.endedOn || !committeeRow.endedOn) {
      throw new Error('Expected restored membership end dates.');
    }
    expect(localDate(restoredTeam.startedOn)).toBe('2024-08-01');
    expect(localDate(restoredTeam.endedOn)).toBe('2025-07-31');
    expect(committeeRow.seasonKey).toBe(2024);
    expect(localDate(committeeRow.endedOn)).toBe('2025-01-15');
    expect(assignedEvents).toHaveLength(2);
    for (const event of assignedEvents) {
      expect(event.eventVersion).toBe(2);
      expect(event.payload).toMatchObject({
        seasonKey: 2024,
        startedOn: '2024-08-01',
        endedOn: null,
      });
      expect(event.payload).not.toHaveProperty('seasonId');
    }
    const removalEvents = membershipEvents.filter(({ eventType }) =>
      eventType.endsWith('.member_removed'),
    );
    expect(removalEvents).toHaveLength(2);
    expect(removalEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aggregateType: 'team_membership',
          eventVersion: 2,
          payload: {
            membershipId: endedTeamMembershipId,
            removedOn: '2026-07-21',
          },
        }),
        expect.objectContaining({
          aggregateType: 'committee_membership',
          eventVersion: 2,
          payload: {
            membershipId: endedCommitteeMembershipId,
            removedOn: '2025-01-15',
          },
        }),
      ]),
    );
    for (const event of removalEvents) {
      expect(event.payload).not.toHaveProperty('endedOn');
    }

    await runner.query('DELETE FROM "team_memberships" WHERE "id" = $1', [
      endedTeamMembershipId,
    ]);
    await runner.query('DELETE FROM "committee_memberships" WHERE "id" = $1', [
      endedCommitteeMembershipId,
    ]);
    await replayMembershipEvents(membershipEvents, runner);

    const [replayedTeam] = (await runner.query(
      'SELECT "endedOn" FROM "team_memberships" WHERE "id" = $1',
      [endedTeamMembershipId],
    )) as MigratedMembershipRow[];
    const [replayedCommittee] = (await runner.query(
      'SELECT "endedOn" FROM "committee_memberships" WHERE "id" = $1',
      [endedCommitteeMembershipId],
    )) as MigratedMembershipRow[];
    expect(localDate(replayedTeam.endedOn!)).toBe(
      localDate(restoredTeam.endedOn),
    );
    expect(localDate(replayedCommittee.endedOn!)).toBe(
      localDate(committeeRow.endedOn),
    );
    expect(indexes).toHaveLength(4);
    expect(constraints).toHaveLength(4);
    expect(seasonsTable).toBeNull();
  });
});

type EndedMembershipFixture = {
  aggregateType: string;
  membershipId: string;
  assignedEventType: string;
  removedEventType: string;
  assignedPayload: Record<string, unknown>;
  removedAt: string;
};

type MigratedMembershipRow = {
  id?: string;
  seasonKey: number;
  startedOn: Date | string;
  endedOn: Date | string | null;
};

type MigratedEventRow = {
  aggregateType: 'team_membership' | 'committee_membership';
  eventType: string;
  eventVersion: number;
  payload: Record<string, unknown>;
};

async function replayMembershipEvents(
  events: MigratedEventRow[],
  runner: QueryRunner,
): Promise<void> {
  const teamProjector = new TeamProjector();
  const committeeProjector = new CommitteeProjector();

  for (const event of events) {
    if (event.eventType === 'team.member_assigned') {
      await teamProjector.projectMemberAssigned(
        event.payload as Parameters<TeamProjector['projectMemberAssigned']>[0],
        runner.manager,
      );
    } else if (event.eventType === 'team.member_removed') {
      await teamProjector.projectMemberRemoved(
        event.payload as Parameters<TeamProjector['projectMemberRemoved']>[0],
        runner.manager,
      );
    } else if (event.eventType === 'committee.member_assigned') {
      await committeeProjector.projectMemberAssigned(
        event.payload as Parameters<
          CommitteeProjector['projectMemberAssigned']
        >[0],
        runner.manager,
      );
    } else if (event.eventType === 'committee.member_removed') {
      await committeeProjector.projectMemberRemoved(
        event.payload as Parameters<
          CommitteeProjector['projectMemberRemoved']
        >[0],
        runner.manager,
      );
    }
  }
}

async function insertEndedMembershipEvents(
  runner: QueryRunner,
  fixture: EndedMembershipFixture,
): Promise<void> {
  await runner.query(
    `INSERT INTO "stored_events"
      ("aggregateType", "aggregateId", "eventType", "eventVersion", "payload", "metadata", "occurredAt")
     VALUES ($1, $2, $3, 1, $4, '{}', $5), ($1, $2, $6, 1, $7, '{}', $8)`,
    [
      fixture.aggregateType,
      fixture.membershipId,
      fixture.assignedEventType,
      fixture.assignedPayload,
      '2024-08-10T10:00:00.000Z',
      fixture.removedEventType,
      { membershipId: fixture.membershipId },
      fixture.removedAt,
    ],
  );
}

function localDate(value: Date | string): string {
  if (typeof value === 'string') {
    return value;
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
  }).format(value);
}
