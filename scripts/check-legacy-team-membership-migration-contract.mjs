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
    'packages/rpc/src/database/migrations/1768300000000-AddLegacyTeamMembershipMigration.ts',
  ),
  read(
    'packages/rpc/scripts/legacy-team-membership-migration/01-create-staging.sql',
  ),
  read(
    'packages/rpc/scripts/legacy-team-membership-migration/02-preflight.sql',
  ),
  read('packages/rpc/scripts/legacy-team-membership-migration/03-migrate.sql'),
  read(
    'packages/rpc/scripts/legacy-team-membership-migration/02a-snapshot.sql',
  ),
  read('packages/rpc/scripts/legacy-team-membership-migration/04-report.sql'),
  read('packages/rpc/scripts/legacy-team-membership-migration/README.md'),
]);

assert.match(schemaMigration, /legacy_team_migration_map/);
assert.match(schemaMigration, /legacy_team_membership_migration_map/);
assert.match(schemaMigration, /DEFERRABLE INITIALLY DEFERRED/);
assert.match(staging, /'coach \/ trainer', 'coach_trainer'/);
assert.match(staging, /'outside hitter', 'outside_hitter'/);
assert.match(preflight, /unknown team function/);
assert.match(preflight, /missing legacy user map/);
assert.match(preflight, /duplicate legacy assignment/);
assert.match(migrate, /legacy_user_migration_map/);
assert.match(migrate, /"seasonStartsOn" \+ 1/);
assert.match(migrate, /AT TIME ZONE 'Europe\/Amsterdam'/);
assert.match(migrate, /'team\.member_assigned'/);
assert.match(migrate, /'seasonKey', resolved\."seasonKey"/);
assert.match(migrate, /ON CONFLICT \(id\) DO NOTHING/);
assert.doesNotMatch(migrate, /^\s*COMMIT;/m);
assert.match(snapshot, /pre-migration-target-rows\.csv/);
assert.match(report, /missing_assignment_events/);
assert.match(report, /full-before-after\.csv/);
assert.match(runbook, /FROM user_team_season membership/);
assert.match(runbook, /Execute exactly\s+one of:/);
assert.match(runbook, /ROLLBACK/);

console.log('Legacy team membership migration contract checks passed.');
