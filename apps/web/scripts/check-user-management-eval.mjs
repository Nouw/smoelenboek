import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [
  page,
  profile,
  sidebar,
  createSchema,
  informationSchema,
  importer,
  roleHandler,
  roleEvent,
] = await Promise.all([
  readFile(new URL('app/users/admin/user-admin-content.tsx', root), 'utf8'),
  readFile(new URL('app/profile/profile-content.tsx', root), 'utf8'),
  readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
  readFile(
    new URL('../../packages/api/src/users/dto/admin-user.dto.ts', root),
    'utf8',
  ),
  readFile(
    new URL(
      '../../packages/api/src/users/dto/update-user-information.dto.ts',
      root,
    ),
    'utf8',
  ),
  readFile(
    new URL('../../packages/rpc/src/users/import/user-import.service.ts', root),
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
]);
const checks = [
  ['admin workspace is discoverable', /\/users\/admin/.test(sidebar)],
  ['non-admins are blocked', /currentUser\.isAdmin/.test(page)],
  [
    'manual creation queues invitations',
    /user\.admin\.create/.test(page) && /Create and invite/.test(page),
  ],
  [
    'spreadsheet requires preview and mapping',
    /requestPreview/.test(page) &&
      /suggestedMapping/.test(page) &&
      /execute/.test(page),
  ],
  [
    'results are exportable',
    /downloadResults/.test(page) && /text\/csv/.test(page),
  ],
  [
    'Dutch and English copy is present',
    /Gebruikers beheren/.test(page) && /Manage users/.test(page),
  ],
  [
    'accessible errors and labels exist',
    /role="alert"/.test(page) && /aria-label/.test(page),
  ],
  [
    'membership start comes from account creation',
    /formatDate\(user\.createdAt\)/.test(profile),
  ],
  [
    'membership start cannot be created, updated, or imported',
    !/joinDate/.test(createSchema) &&
      !/joinDate/.test(informationSchema) &&
      !/joinDate/.test(importer),
  ],
  [
    'administrator role is visible and manageable',
    /accessorKey: 'role'/.test(page) && /user\.admin\.setRole/.test(page),
  ],
  [
    'grant and revoke require confirmation',
    /grantAdminTitle/.test(page) &&
      /revokeAdminTitle/.test(page) &&
      /DialogDescription/.test(page),
  ],
  [
    'self-revocation is blocked in both UI and backend',
    /currentUser\.isOwner/.test(page) &&
      /cannot revoke their own administrator rights/i.test(roleHandler),
  ],
  [
    'concurrent changes cannot remove every admin',
    /pg_advisory_xact_lock/.test(roleHandler) &&
      /final administrator cannot be revoked/i.test(roleHandler),
  ],
  [
    'role changes leave an actor-attributed audit event',
    /appendPreparedAndPublish/.test(roleHandler) &&
      /user\.role_changed/.test(roleEvent) &&
      /actorUserId/.test(roleEvent),
  ],
  [
    'role management is localized',
    /Beheerdersrechten geven/.test(page) &&
      /Grant administrator rights/.test(page),
  ],
  [
    'active and inactive tabs filter the managed list',
    /role="tablist"/.test(page) &&
      /aria-selected=\{status === tab\}/.test(page) &&
      /limit: 100, offset: 0, status/.test(page),
  ],
  [
    'inactive rows show their leave date',
    /row\.original\.leaveDate/.test(page) && /deregisteredOn/.test(page),
  ],
  [
    'membership actions require confirmation',
    /user\.admin\.deregister\.useMutation/.test(page) &&
      /user\.admin\.reactivate\.useMutation/.test(page) &&
      /deregisterTitle/.test(page) &&
      /reactivateTitle/.test(page) &&
      /confirmDeregister/.test(page) &&
      /confirmReactivate/.test(page),
  ],
  [
    'self-deregistration is disabled',
    /membershipPending \|\| currentUser\.isOwner\(row\.original\.id\)/.test(
      page,
    ) && /cannotDeregisterSelf/.test(page),
  ],
  [
    'membership actions show failures and refresh lists',
    /membershipError\.message/.test(page) &&
      /utils\.user\.admin\.list\.invalidate\(\)/.test(page),
  ],
  [
    'membership copy is localized',
    /Gebruiker uitschrijven/.test(page) &&
      /Deregister user/.test(page) &&
      /Gebruiker heractiveren/.test(page) &&
      /Reactivate user/.test(page),
  ],
];
for (const [name, passed] of checks)
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
assert.ok(
  checks.every(([, passed]) => passed),
  'User-management UX eval failed.',
);
console.log(
  `User-management UX eval passed with ${checks.length}/${checks.length}.`,
);
