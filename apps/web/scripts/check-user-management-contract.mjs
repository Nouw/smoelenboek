import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [page, apiContract, router, handler, event, listHandler] =
  await Promise.all([
    readFile(new URL('app/users/admin/user-admin-content.tsx', root), 'utf8'),
    readFile(
      new URL('../../packages/api/src/users/dto/admin-user.dto.ts', root),
      'utf8',
    ),
    readFile(
      new URL('../../packages/rpc/src/users/trpc/user.router.ts', root),
      'utf8',
    ),
    readFile(
      new URL(
        '../../packages/rpc/src/users/commands/admin-user.handlers.ts',
        root,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../../packages/rpc/src/users/events/user-role-changed.event.ts',
        root,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../../packages/rpc/src/users/queries/admin-user.handlers.ts',
        root,
      ),
      'utf8',
    ),
  ]);

assert.match(apiContract, /managedUserRoleSchema = z\.enum\(\['user', 'admin'\]\)/);
assert.match(apiContract, /userId: z\.uuid\(\)/);
assert.match(apiContract, /role: ManagedUserRole/);
assert.match(router, /setRole: adminProcedure/);
assert.match(router, /new SetManagedUserRoleCommand\(ctx\.userId/);
assert.match(listHandler, /u\."role"/);

assert.match(page, /user\.admin\.setRole\.useMutation/);
assert.match(page, /accessorKey: 'role'/);
assert.match(page, /currentUser\.isOwner\(row\.original\.id\)/);
assert.match(page, /grantAdminTitle/);
assert.match(page, /revokeAdminTitle/);
assert.match(page, /role="alert"/);

assert.match(handler, /pg_advisory_xact_lock/);
assert.match(handler, /actor\.role !== 'admin'/);
assert.match(handler, /cannot revoke their own administrator rights/i);
assert.match(handler, /final administrator cannot be revoked/i);
assert.match(handler, /appendPreparedAndPublish/);
assert.match(event, /USER_ROLE_CHANGED_EVENT = 'user\.role_changed'/);
assert.match(event, /source: 'admin'/);
assert.match(event, /actorUserId/);

console.log('User-management role contract passed.');
