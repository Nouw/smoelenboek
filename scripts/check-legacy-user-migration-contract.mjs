import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [auth, entity, migration, importSql, snapshotSql, reportSql, runbook] =
  await Promise.all([
    read('packages/rpc/src/auth/better-auth-instance.ts'),
    read('packages/rpc/src/users/entities/user.entity.ts'),
    read(
      'packages/rpc/src/database/migrations/1768100000000-AddLegacyUserMigration.ts',
    ),
    read('packages/rpc/scripts/legacy-user-migration/03-migrate.sql'),
    read('packages/rpc/scripts/legacy-user-migration/02a-snapshot.sql'),
    read('packages/rpc/scripts/legacy-user-migration/04-report.sql'),
    read('packages/rpc/scripts/legacy-user-migration/README.md'),
  ]);

assert.match(auth, /verifyPasswordWithLegacySupport/);
assert.match(auth, /revokeSessionsOnPasswordReset:\s*true/);
assert.match(auth, /completePasswordMigration/);
assert.match(entity, /passwordMigrationRequired/);
assert.match(migration, /legacy_user_migration_map/);
assert.match(importSql, /WHERE NOT EXISTS[\s\S]*"providerId" = 'credential'/);
assert.doesNotMatch(importSql, /UPDATE account[\s\S]*password/i);
assert.match(importSql, /-- No COMMIT here/);
assert.match(snapshotSql, /pre-migration-target-rows\.csv/);
assert.match(reportSql, /overwritten_modern_credentials/);
assert.match(reportSql, /full-before-after\.csv/);
assert.match(runbook, /ROLLBACK/);
assert.match(runbook, /profilePicture/);

console.log('Legacy user migration contract checks passed.');
