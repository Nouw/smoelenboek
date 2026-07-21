import { describe, expect, it, jest } from '@jest/globals';

import { FixBetterAuthIdDefaults1767300000000 } from './migrations/1767300000000-FixBetterAuthIdDefaults';

describe('FixBetterAuthIdDefaults1767300000000', () => {
  it('handles source columns that are already UUID typed', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new FixBetterAuthIdDefaults1767300000000();

    await migration.up({ query } as never);

    const typeStatements = query.mock.calls
      .map(([statement]) => String(statement))
      .filter((statement) => statement.includes('TYPE uuid'));

    expect(typeStatements).toHaveLength(4);
    for (const statement of typeStatements) {
      expect(statement).toContain('"id"::text ~*');
      expect(statement).toContain('"id"::text::uuid');
    }
  });
});
