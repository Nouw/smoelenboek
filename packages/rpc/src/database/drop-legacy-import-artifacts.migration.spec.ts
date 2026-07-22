import { describe, expect, it, jest } from '@jest/globals';

import { DropLegacyImportArtifacts1768500000000 } from './migrations/1768500000000-DropLegacyImportArtifacts';

describe('DropLegacyImportArtifacts1768500000000', () => {
  it('removes staging and durable mapping tables safely', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new DropLegacyImportArtifacts1768500000000();

    await migration.up({ query } as never);

    expect(query.mock.calls).toEqual([
      ['DROP TABLE IF EXISTS "legacy_committee_role_import_map"'],
      ['DROP TABLE IF EXISTS "legacy_committee_membership_import_staging"'],
      ['DROP TABLE IF EXISTS "legacy_team_role_import_map"'],
      ['DROP TABLE IF EXISTS "legacy_team_membership_import_staging"'],
      ['DROP TABLE IF EXISTS "legacy_user_import_staging"'],
      ['DROP TABLE IF EXISTS "legacy_committee_membership_migration_map"'],
      ['DROP TABLE IF EXISTS "legacy_committee_migration_map"'],
      ['DROP TABLE IF EXISTS "legacy_team_membership_migration_map"'],
      ['DROP TABLE IF EXISTS "legacy_team_migration_map"'],
      ['DROP TABLE IF EXISTS "legacy_user_migration_map"'],
    ]);
  });

  it('rejects rollback because removed import data cannot be restored', async () => {
    const migration = new DropLegacyImportArtifacts1768500000000();

    await expect(migration.down()).rejects.toThrow('irreversible');
  });
});
