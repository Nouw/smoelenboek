import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { DataSource, QueryRunner } from 'typeorm';

import { CreateUsers1766810000000 } from '../src/database/migrations/1766810000000-CreateUsers';
import { CreatePolls1769100000000 } from '../src/database/migrations/1769100000000-CreatePolls';

const databaseUrl = process.env.TEST_POLLS_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('Polls PostgreSQL fixture', () => {
  let dataSource: DataSource;
  let runner: QueryRunner;
  const ids = {
    user: '11111111-1111-4111-8111-111111111111',
    poll: '22222222-2222-4222-8222-222222222222',
    optionA: '33333333-3333-4333-8333-333333333333',
    optionB: '44444444-4444-4444-8444-444444444444',
    response: '55555555-5555-4555-8555-555555555555',
  };

  beforeAll(async () => {
    if (!databaseUrl) throw new Error('TEST_POLLS_DATABASE_URL is required.');
    dataSource = new DataSource({ type: 'postgres', url: databaseUrl });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.startTransaction();
    await new CreateUsers1766810000000().up(runner);
    await new CreatePolls1769100000000().up(runner);
    await runner.query(
      'INSERT INTO "users" ("id", "clerkUserId") VALUES ($1, $2)',
      [ids.user, 'poll-member'],
    );
    await runner.query(
      `INSERT INTO "polls" ("id", "question", "choiceMode", "opensAt", "closesAt", "publishedAt")
       VALUES ($1, 'Pick one', 'single_choice', '2026-08-08T09:00:00Z', '2026-08-08T11:00:00Z', '2026-08-01')`,
      [ids.poll],
    );
    await runner.query(
      `INSERT INTO "poll_options" ("id", "pollId", "label", "position")
       VALUES ($1, $3, 'A', 0), ($2, $3, 'B', 1)`,
      [ids.optionA, ids.optionB, ids.poll],
    );
  });

  afterAll(async () => {
    if (runner) {
      await runner.rollbackTransaction();
      await runner.release();
    }
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('enforces one response per member and atomically replaceable selections', async () => {
    await runner.query(
      'INSERT INTO "poll_responses" ("id", "pollId", "userId") VALUES ($1, $2, $3)',
      [ids.response, ids.poll, ids.user],
    );
    await runner.query(
      'INSERT INTO "poll_selections" ("id", "responseId", "optionId") VALUES (gen_random_uuid(), $1, $2)',
      [ids.response, ids.optionA],
    );
    await runner.query('SAVEPOINT duplicate_response');
    await expect(
      runner.query(
        'INSERT INTO "poll_responses" ("id", "pollId", "userId") VALUES (gen_random_uuid(), $1, $2)',
        [ids.poll, ids.user],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await runner.query('ROLLBACK TO SAVEPOINT duplicate_response');

    await runner.query(
      'DELETE FROM "poll_selections" WHERE "responseId" = $1',
      [ids.response],
    );
    await runner.query(
      'INSERT INTO "poll_selections" ("id", "responseId", "optionId") VALUES (gen_random_uuid(), $1, $2)',
      [ids.response, ids.optionB],
    );
    const rows = await runner.query(
      `SELECT o.label, COUNT(s.id)::int AS count
       FROM "poll_options" o LEFT JOIN "poll_selections" s ON s."optionId" = o.id
       WHERE o."pollId" = $1 GROUP BY o.id ORDER BY o.position`,
      [ids.poll],
    );
    expect(rows).toEqual([
      { label: 'A', count: 0 },
      { label: 'B', count: 1 },
    ]);
  });
});
