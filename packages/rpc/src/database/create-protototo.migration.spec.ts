import { describe, expect, it, jest } from '@jest/globals';

import { CreateProtototo1768600000000 } from './migrations/1768600000000-CreateProtototo';

describe('CreateProtototo1768600000000', () => {
  it('creates constrained rounds, matches, entries, and predictions', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new CreateProtototo1768600000000().up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    for (const table of [
      'protototo_rounds',
      'protototo_matches',
      'protototo_entries',
      'protototo_predictions',
    ]) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
    expect(sql).toContain('"opensAt" < "closesAt"');
    expect(sql).toContain('EX_protototo_rounds_no_published_overlap');
    expect(sql).toContain('UQ_protototo_entries_member');
    expect(sql).toContain('UQ_protototo_entries_anonymous');
    expect(sql).toContain('CHK_protototo_matches_format');
    expect(sql).toContain('CHK_protototo_matches_result_status');
    expect(sql).toContain(
      `"participantType" = 'member' AND "userId" IS NOT NULL`,
    );
    expect(sql).toContain('ON DELETE CASCADE');
  });

  it('drops Protototo objects in dependency order', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new CreateProtototo1768600000000().down({ query } as never);

    const statements = query.mock.calls.map(([statement]) => statement);
    expect(
      statements.indexOf('DROP TABLE "protototo_predictions"'),
    ).toBeLessThan(statements.indexOf('DROP TABLE "protototo_entries"'));
    expect(statements.at(-1)).toBe('DROP TABLE "protototo_rounds"');
  });
});
