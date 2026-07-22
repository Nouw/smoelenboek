import { describe, expect, it, jest } from '@jest/globals';

import { AddLegacyUserMigration1768100000000 } from './migrations/1768100000000-AddLegacyUserMigration';

describe('AddLegacyUserMigration1768100000000', () => {
  it('adds reset state and a durable relation migration map', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddLegacyUserMigration1768100000000();

    await migration.up({ query } as never);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('"passwordMigrationRequired"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE "legacy_user_migration_map"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DEFERRABLE INITIALLY DEFERRED'),
    );
  });

  it('removes migration-only schema on revert', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddLegacyUserMigration1768100000000();

    await migration.down({ query } as never);

    expect(query).toHaveBeenCalledWith(
      'DROP TABLE "legacy_user_migration_map"',
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'DROP COLUMN IF EXISTS "passwordMigrationRequired"',
      ),
    );
  });
});
