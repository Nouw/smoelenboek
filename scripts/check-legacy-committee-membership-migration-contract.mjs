import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [
  schemaMigration,
  staging,
  preflight,
  migrate,
  snapshot,
  report,
  runbook,
] = await Promise.all([
  read(
    'packages/rpc/src/database/migrations/1768400000000-AddLegacyCommitteeMembershipMigration.ts',
  ),
  read(
    'packages/rpc/scripts/legacy-committee-membership-migration/01-create-staging.sql',
  ),
  read(
    'packages/rpc/scripts/legacy-committee-membership-migration/02-preflight.sql',
  ),
  read(
    'packages/rpc/scripts/legacy-committee-membership-migration/03-migrate.sql',
  ),
  read(
    'packages/rpc/scripts/legacy-committee-membership-migration/02a-snapshot.sql',
  ),
  read(
    'packages/rpc/scripts/legacy-committee-membership-migration/04-report.sql',
  ),
  read('packages/rpc/scripts/legacy-committee-membership-migration/README.md'),
]);

assert.match(schemaMigration, /legacy_committee_migration_map/);
assert.match(schemaMigration, /legacy_committee_membership_migration_map/);
assert.match(schemaMigration, /DEFERRABLE INITIALLY DEFERRED/);
assert.match(staging, /'commissielid', 'commissielid'/);
assert.match(
  staging,
  /'commissaris arbitrage en zaalwacht', 'commissaris_zaalwacht_en_arbitrage'/,
);
assert.match(staging, /ADD COLUMN IF NOT EXISTS "email" text/);
assert.match(preflight, /unknown committee function/);
assert.match(preflight, /email does not resolve exactly one PostgreSQL user/);
assert.match(preflight, /duplicate legacy assignment/);
assert.match(migrate, /lower\(btrim\(app_user\.email\)\)/);
assert.doesNotMatch(migrate, /legacy_user_migration_map/);
assert.match(migrate, /"seasonStartsOn" \+ 1/);
assert.match(migrate, /AT TIME ZONE 'Europe\/Amsterdam'/);
assert.match(migrate, /'committee\.member_assigned'/);
assert.match(migrate, /'seasonKey', resolved\."seasonKey"/);
assert.match(migrate, /ON CONFLICT \(id\) DO NOTHING/);
assert.doesNotMatch(migrate, /^\s*COMMIT;/m);
assert.match(snapshot, /pre-migration-target-rows\.csv/);
assert.match(report, /missing_assignment_events/);
assert.match(report, /full-before-after\.csv/);
assert.match(runbook, /FROM user_committee_season membership/);
assert.match(runbook, /JOIN `user` legacy_user/);
assert.match(runbook, /legacy_user_migration_map.*is not required/);
assert.match(runbook, /Execute exactly\s+one of:/);
assert.match(runbook, /ROLLBACK/);

console.log('Legacy committee membership migration contract checks passed.');
