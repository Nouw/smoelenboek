import { describe, expect, it, jest } from '@jest/globals';

import { AddLegacyCommitteeMembershipMigration1768400000000 } from './migrations/1768400000000-AddLegacyCommitteeMembershipMigration';

describe('AddLegacyCommitteeMembershipMigration1768400000000', () => {
  it('adds durable committee and membership ID maps', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddLegacyCommitteeMembershipMigration1768400000000();

    await migration.up({ query } as never);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE "legacy_committee_migration_map"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'CREATE TABLE "legacy_committee_membership_migration_map"',
      ),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DEFERRABLE INITIALLY DEFERRED'),
    );
  });

  it('removes the membership map before the committee map', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddLegacyCommitteeMembershipMigration1768400000000();

    await migration.down({ query } as never);

    expect(query.mock.calls).toEqual([
      ['DROP TABLE "legacy_committee_membership_migration_map"'],
      ['DROP TABLE "legacy_committee_migration_map"'],
    ]);
  });
});
