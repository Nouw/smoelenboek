import { describe, expect, it, jest } from '@jest/globals';

import { AddTeamCategory1768800000000 } from './migrations/1768800000000-AddTeamCategory';

describe('AddTeamCategory1768800000000', () => {
  it('backfills teams and snapshot events before enforcing the category', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddTeamCategory1768800000000();

    await migration.up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain("WHEN \"name\" ILIKE 'Heren %' THEN 'men'");
    expect(sql).toContain("WHEN \"name\" ILIKE 'Dames %' THEN 'women'");
    expect(sql).toContain('Cannot classify % team(s)');
    expect(sql).toContain('\'category\', team."category"');
    expect(sql).toContain('"eventVersion" = 2');
    expect(sql).toContain("CHECK (\"category\" IN ('men', 'women'))");
  });

  it('drops the category schema and event field on rollback', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddTeamCategory1768800000000();

    await migration.down({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP COLUMN "category"');
    expect(sql).toContain('"payload" = "payload" - \'category\'');
  });
});
