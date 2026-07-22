import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [shell, resetPage] = await Promise.all([
  readFile(new URL('app/app-shell.tsx', root), 'utf8'),
  readFile(new URL('app/reset-password/page.tsx', root), 'utf8'),
]);

assert.match(shell, /passwordMigrationRequired/);
assert.match(resetPage, /authClient\.resetPassword/);
assert.match(resetPage, /searchParams\.get\('token'\)/);
assert.match(resetPage, /minLength=\{8\}/);

console.log('Password reset UI contract checks passed.');
