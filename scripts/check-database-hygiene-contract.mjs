import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const removedDirectories = [
  'packages/rpc/scripts/legacy-user-migration',
  'packages/rpc/scripts/legacy-team-membership-migration',
  'packages/rpc/scripts/legacy-committee-membership-migration',
];
const removedFiles = [
  'packages/rpc/src/database/migrations/1768100000000-AddLegacyUserMigration.ts',
  'packages/rpc/src/database/migrations/1768300000000-AddLegacyTeamMembershipMigration.ts',
  'packages/rpc/src/database/migrations/1768400000000-AddLegacyCommitteeMembershipMigration.ts',
  'packages/rpc/src/database/add-legacy-user-migration.migration.spec.ts',
  'packages/rpc/src/database/add-legacy-team-membership-migration.migration.spec.ts',
  'packages/rpc/src/database/add-legacy-committee-membership-migration.migration.spec.ts',
  'packages/rpc/test/legacy-user-migration.e2e-spec.ts',
  'packages/rpc/test/legacy-team-membership-migration.e2e-spec.ts',
  'packages/rpc/test/legacy-committee-membership-migration.e2e-spec.ts',
  'scripts/check-legacy-user-migration-contract.mjs',
  'scripts/check-legacy-team-membership-migration-contract.mjs',
  'scripts/check-legacy-committee-membership-migration-contract.mjs',
];

for (const path of removedDirectories) {
  try {
    assert.deepEqual(await readdir(new URL(path, root)), []);
  } catch (error) {
    assert.equal(error.code, 'ENOENT');
  }
}

for (const path of removedFiles) {
  await assert.rejects(access(new URL(path, root)));
}

const [cleanupMigration, auth] = await Promise.all([
  readFile(
    new URL(
      'packages/rpc/src/database/migrations/1768500000000-DropLegacyImportArtifacts.ts',
      root,
    ),
    'utf8',
  ),
  readFile(
    new URL('packages/rpc/src/auth/legacy-password-migration.ts', root),
    'utf8',
  ),
]);

for (const table of [
  'legacy_user_import_staging',
  'legacy_team_membership_import_staging',
  'legacy_committee_membership_import_staging',
  'legacy_user_migration_map',
  'legacy_team_migration_map',
  'legacy_team_membership_migration_map',
  'legacy_committee_migration_map',
  'legacy_committee_membership_migration_map',
]) {
  assert.match(cleanupMigration, new RegExp(table));
}

assert.match(cleanupMigration, /DROP TABLE IF EXISTS/);
assert.match(auth, /bcrypt/);

console.log('Database hygiene contract checks passed.');
