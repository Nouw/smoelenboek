import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { DataSource, QueryRunner } from 'typeorm';

import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreateProtototo1768600000000 } from '../src/database/migrations/1768600000000-CreateProtototo';
import { toAdminEntryOutput } from '../src/protototo/dto/protototo-output';

const databaseUrl = process.env.TEST_PROTOTOTO_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('Protototo PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeAll(async () => {
    if (!databaseUrl)
      throw new Error('TEST_PROTOTOTO_DATABASE_URL is required.');
    dataSource = new DataSource({ type: 'postgres', url: databaseUrl });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.startTransaction();
    await new CreateUsers1766810000000().up(runner);
    await new CreateProtototo1768600000000().up(runner);
  });

  afterAll(async () => {
    if (runner) {
      await runner.rollbackTransaction();
      await runner.release();
    }
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('persists member and anonymous entries with independent predictions', async () => {
    const ids = {
      user: '11111111-1111-4111-8111-111111111111',
      round: '22222222-2222-4222-8222-222222222222',
      match: '33333333-3333-4333-8333-333333333333',
      memberEntry: '44444444-4444-4444-8444-444444444444',
      anonymousEntry: '55555555-5555-4555-8555-555555555555',
    };
    await runner.query(
      'INSERT INTO "users" ("id", "clerkUserId") VALUES ($1, $2)',
      [ids.user, 'protototo-user'],
    );
    await runner.query(
      `INSERT INTO "protototo_rounds"
        ("id", "title", "opensAt", "closesAt", "publishedAt")
       VALUES ($1, 'Septemberronde', '2026-09-01', '2026-09-10', '2026-08-01')`,
      [ids.round],
    );
    await runner.query(
      `INSERT INTO "protototo_matches"
        ("id", "roundId", "nevoboMatchId", "selectedTeamIri", "homeTeamIri", "homeTeamName", "awayTeamIri", "awayTeamName", "subjectSide", "format", "pointMethodIri", "startsAt")
       VALUES ($1, $2, $3, '/teams/protos', '/teams/protos', 'Protos DS 1', '/teams/other', 'Opponent', 'home', 'best_of_5', '/methods/best-of-5', '2026-09-11')`,
      [ids.match, ids.round, '66666666-6666-4666-8666-666666666666'],
    );
    await runner.query(
      `INSERT INTO "protototo_entries"
        ("id", "roundId", "userId", "participantType", "firstName")
       VALUES ($1, $2, $3, 'member', 'Member')`,
      [ids.memberEntry, ids.round, ids.user],
    );
    await runner.query(
      `INSERT INTO "protototo_entries"
        ("id", "roundId", "participantType", "firstName", "email", "emailNormalized", "firstNameNormalized", "paymentClaimedAt")
       VALUES ($1, $2, 'anonymous', 'Ada', 'ada@example.com', 'ada@example.com', 'ada', now())`,
      [ids.anonymousEntry, ids.round],
    );
    await runner.query(
      `INSERT INTO "protototo_predictions"
        ("id", "entryId", "matchId", "setWinners")
       VALUES
        (gen_random_uuid(), $1, $3, ARRAY[true,true,true]),
        (gen_random_uuid(), $2, $3, ARRAY[true,false,true,false,true])`,
      [ids.memberEntry, ids.anonymousEntry, ids.match],
    );

    const rows = await runner.query(
      `SELECT e."participantType", cardinality(p."setWinners") AS sets
       FROM "protototo_entries" e
       JOIN "protototo_predictions" p ON p."entryId" = e."id"
       ORDER BY e."participantType"`,
    );
    expect(rows).toEqual([
      { participantType: 'anonymous', sets: 5 },
      { participantType: 'member', sets: 3 },
    ]);
  });

  it('covers replacement, late lineup changes, final scoring, and CSV source rows', async () => {
    const ids = {
      user: '71111111-1111-4111-8111-111111111111',
      round: '72222222-2222-4222-8222-222222222222',
      activeMatch: '73333333-3333-4333-8333-333333333333',
      removedMatch: '74444444-4444-4444-8444-444444444444',
      lateMatch: '75555555-5555-4555-8555-555555555555',
      memberEntry: '76666666-6666-4666-8666-666666666666',
      anonymousEntry: '77777777-7777-4777-8777-777777777777',
    };
    await runner.query(
      'INSERT INTO "users" ("id", "clerkUserId") VALUES ($1, $2)',
      [ids.user, 'protototo-workflow-user'],
    );
    await runner.query(
      `INSERT INTO "protototo_rounds"
        ("id", "title", "opensAt", "closesAt", "publishedAt")
       VALUES ($1, 'Workflow', '2026-10-01', '2026-10-09', '2026-09-01')`,
      [ids.round],
    );
    for (const [id, nevoboId] of [
      [ids.activeMatch, '81111111-1111-4111-8111-111111111111'],
      [ids.removedMatch, '82222222-2222-4222-8222-222222222222'],
    ]) {
      await runner.query(
        `INSERT INTO "protototo_matches"
          ("id", "roundId", "nevoboMatchId", "selectedTeamIri", "homeTeamIri", "homeTeamName", "awayTeamIri", "awayTeamName", "subjectSide", "format", "pointMethodIri", "startsAt")
         VALUES ($1, $2, $3, '/teams/protos', '/teams/protos', 'Protos', '/teams/other', 'Opponent', 'home', 'best_of_5', '/methods/best-of-5', '2026-10-10')`,
        [id, ids.round, nevoboId],
      );
    }
    await runner.query(
      `INSERT INTO "protototo_entries"
        ("id", "roundId", "userId", "participantType", "firstName")
       VALUES ($1, $2, $3, 'member', 'Member')`,
      [ids.memberEntry, ids.round, ids.user],
    );
    await runner.query(
      `INSERT INTO "protototo_entries"
        ("id", "roundId", "participantType", "firstName", "email", "emailNormalized", "firstNameNormalized", "paymentClaimedAt")
       VALUES ($1, $2, 'anonymous', 'Ada', 'ada.workflow@example.com', 'ada.workflow@example.com', 'ada', '2026-10-02')`,
      [ids.anonymousEntry, ids.round],
    );
    for (const entryId of [ids.memberEntry, ids.anonymousEntry]) {
      await runner.query(
        `INSERT INTO "protototo_predictions"
          ("id", "entryId", "matchId", "setWinners")
         VALUES
          (gen_random_uuid(), $1, $2, ARRAY[true,true,true]),
          (gen_random_uuid(), $1, $3, ARRAY[false,false,false])`,
        [entryId, ids.activeMatch, ids.removedMatch],
      );
    }

    await runner.query('SAVEPOINT duplicate_identity');
    await expect(
      runner.query(
        `INSERT INTO "protototo_entries"
          ("id", "roundId", "participantType", "firstName", "email", "emailNormalized", "firstNameNormalized")
         VALUES (gen_random_uuid(), $1, 'anonymous', 'Ada', 'ada.workflow@example.com', 'ada.workflow@example.com', 'ada')`,
        [ids.round],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await runner.query('ROLLBACK TO SAVEPOINT duplicate_identity');

    await runner.query(
      `DELETE FROM "protototo_predictions"
       WHERE "entryId" = $1 AND "matchId" = $2`,
      [ids.anonymousEntry, ids.activeMatch],
    );
    await runner.query(
      `INSERT INTO "protototo_predictions"
        ("id", "entryId", "matchId", "setWinners")
       VALUES (gen_random_uuid(), $1, $2, ARRAY[true,false,true,false,true])`,
      [ids.anonymousEntry, ids.activeMatch],
    );

    await runner.query(
      `INSERT INTO "protototo_matches"
        ("id", "roundId", "nevoboMatchId", "selectedTeamIri", "homeTeamIri", "homeTeamName", "awayTeamIri", "awayTeamName", "subjectSide", "format", "pointMethodIri", "startsAt", "resultStatus", "resultSetWinners", "resultSyncedAt")
       VALUES ($1, $2, '83333333-3333-4333-8333-333333333333', '/teams/protos', '/teams/protos', 'Protos', '/teams/late', 'Late opponent', 'home', 'best_of_5', '/methods/best-of-5', '2026-10-11', 'final', ARRAY[true,true,true], '2026-10-11T20:00:00Z')`,
      [ids.lateMatch, ids.round],
    );
    await runner.query(
      `UPDATE "protototo_matches"
       SET "resultStatus" = 'final',
           "resultSetWinners" = ARRAY[true,false,true,false,true],
           "resultSyncedAt" = '2026-10-10T20:00:00Z'
       WHERE "id" = $1`,
      [ids.activeMatch],
    );
    await runner.query(
      `UPDATE "protototo_matches"
       SET "removedAt" = '2026-10-09T12:00:00Z',
           "resultStatus" = 'final',
           "resultSetWinners" = ARRAY[false,false,false],
           "resultSyncedAt" = '2026-10-10T20:00:00Z'
       WHERE "id" = $1`,
      [ids.removedMatch],
    );

    const entryRows = (await runner.query(
      `SELECT * FROM "protototo_entries" WHERE "roundId" = $1 ORDER BY "participantType"`,
      [ids.round],
    )) as Array<Record<string, unknown>>;
    const activeMatches = (await runner.query(
      `SELECT * FROM "protototo_matches"
       WHERE "roundId" = $1 AND "removedAt" IS NULL
       ORDER BY "startsAt"`,
      [ids.round],
    )) as Array<Record<string, unknown>>;
    const csvSourceRows = [];
    for (const entry of entryRows) {
      const predictions = await runner.query(
        'SELECT * FROM "protototo_predictions" WHERE "entryId" = $1',
        [entry.id],
      );
      csvSourceRows.push(
        toAdminEntryOutput(
          { ...entry, predictions } as never,
          activeMatches as never,
        ),
      );
    }

    expect(csvSourceRows).toEqual([
      expect.objectContaining({
        id: ids.anonymousEntry,
        participantType: 'anonymous',
        email: 'ada.workflow@example.com',
        paymentClaimed: true,
        complete: false,
        matchPoints: [
          { matchId: ids.activeMatch, points: 6 },
          { matchId: ids.lateMatch, points: 0 },
        ],
        totalPoints: 6,
      }),
      expect.objectContaining({
        id: ids.memberEntry,
        participantType: 'member',
        email: null,
        paymentClaimed: false,
        complete: false,
        matchPoints: [
          { matchId: ids.activeMatch, points: 3 },
          { matchId: ids.lateMatch, points: 0 },
        ],
        totalPoints: 3,
      }),
    ]);
  });

  it('rejects overlapping published rounds at the PostgreSQL boundary', async () => {
    await runner.query('SAVEPOINT overlapping_round');
    await runner.query(
      `INSERT INTO "protototo_rounds"
        ("id", "title", "opensAt", "closesAt", "publishedAt")
       VALUES ('88888888-8888-4888-8888-888888888888', 'Baseline', '2027-02-01', '2027-02-10', '2027-01-01')`,
    );
    await expect(
      runner.query(
        `INSERT INTO "protototo_rounds"
          ("id", "title", "opensAt", "closesAt", "publishedAt")
         VALUES ('89999999-9999-4999-8999-999999999999', 'Overlap', '2027-02-05', '2027-02-08', '2027-01-01')`,
      ),
    ).rejects.toMatchObject({ code: '23P01' });
    await runner.query('ROLLBACK TO SAVEPOINT overlapping_round');
  });
});
