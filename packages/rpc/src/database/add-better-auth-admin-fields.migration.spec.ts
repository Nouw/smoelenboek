import { describe, expect, it, jest } from '@jest/globals';

import { AddBetterAuthAdminFields1767800000000 } from './migrations/1767800000000-AddBetterAuthAdminFields';

describe('AddBetterAuthAdminFields1767800000000', () => {
  it('adds Better Auth admin plugin fields', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddBetterAuthAdminFields1767800000000();

    await migration.up({ query } as never);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "role"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "banned"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "impersonatedBy"'),
    );
  });

  it('drops Better Auth admin plugin fields on revert', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddBetterAuthAdminFields1767800000000();

    await migration.down({ query } as never);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN IF EXISTS "impersonatedBy"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN IF EXISTS "role"'),
    );
  });
});
