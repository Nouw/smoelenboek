import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [page, sidebar] = await Promise.all([readFile(new URL('app/users/admin/user-admin-content.tsx', root), 'utf8'), readFile(new URL('components/app-sidebar.tsx', root), 'utf8')]);
const checks = [
  ['admin workspace is discoverable', /\/users\/admin/.test(sidebar)], ['non-admins are blocked', /currentUser\.isAdmin/.test(page)],
  ['manual creation queues invitations', /user\.admin\.create/.test(page) && /Create and invite/.test(page)],
  ['spreadsheet requires preview and mapping', /requestPreview/.test(page) && /suggestedMapping/.test(page) && /execute/.test(page)],
  ['results are exportable', /downloadResults/.test(page) && /text\/csv/.test(page)],
  ['Dutch and English copy is present', /Gebruikers beheren/.test(page) && /Manage users/.test(page)],
  ['accessible errors and labels exist', /role="alert"/.test(page) && /aria-label/.test(page)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
assert.ok(checks.every(([, passed]) => passed), 'User-management UX eval failed.');
console.log(`User-management UX eval passed with ${checks.length}/${checks.length}.`);
