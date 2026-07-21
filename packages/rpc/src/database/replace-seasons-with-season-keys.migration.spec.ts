import { describe, expect, it, jest } from '@jest/globals';

import { ReplaceSeasonsWithSeasonKeys1767900000000 } from './migrations/1767900000000-ReplaceSeasonsWithSeasonKeys';

describe('ReplaceSeasonsWithSeasonKeys1767900000000', () => {
  it('backfills keys, restores ended history, canonicalizes events, and drops seasons', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new ReplaceSeasonsWithSeasonKeys1767900000000();

    await migration.up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('ADD "seasonKey" smallint');
    expect(sql).toContain("AT TIME ZONE 'Europe/Amsterdam'");
    expect(sql).toContain('event."eventType" = \'team.member_removed\'');
    expect(sql).toContain('event."eventType" = \'committee.member_removed\'');
    expect(sql).toContain("'seasonKey'");
    expect(sql).toContain('WHERE "endedOn" IS NULL');
    expect(sql).toContain('"endedOn" < make_date("seasonKey" + 1, 8, 1)');
    expect(sql).toContain('DROP TABLE "seasons"');
  });

  it('refuses a rollback that would discard retained history', async () => {
    const migration = new ReplaceSeasonsWithSeasonKeys1767900000000();

    await expect(migration.down()).rejects.toThrow(
      'cannot be reverted without discarding preserved membership history',
    );
  });
});
