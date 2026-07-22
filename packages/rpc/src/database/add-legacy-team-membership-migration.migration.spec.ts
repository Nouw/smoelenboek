import { describe, expect, it, jest } from '@jest/globals';

import { AddLegacyTeamMembershipMigration1768300000000 } from './migrations/1768300000000-AddLegacyTeamMembershipMigration';

describe('AddLegacyTeamMembershipMigration1768300000000', () => {
  it('adds durable team and membership ID maps', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddLegacyTeamMembershipMigration1768300000000();

    await migration.up({ query } as never);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE "legacy_team_migration_map"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'CREATE TABLE "legacy_team_membership_migration_map"',
      ),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DEFERRABLE INITIALLY DEFERRED'),
    );
  });

  it('removes the membership map before the team map', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddLegacyTeamMembershipMigration1768300000000();

    await migration.down({ query } as never);

    expect(query.mock.calls).toEqual([
      ['DROP TABLE "legacy_team_membership_migration_map"'],
      ['DROP TABLE "legacy_team_migration_map"'],
    ]);
  });
});
