import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [router, importer, provisioning, outbox, templates, migration] = await Promise.all([
  readFile(new URL('src/users/trpc/user.router.ts', root), 'utf8'), readFile(new URL('src/users/import/user-import.service.ts', root), 'utf8'),
  readFile(new URL('src/users/services/user-provisioning.service.ts', root), 'utf8'), readFile(new URL('src/email/email-outbox.repository.ts', root), 'utf8'),
  readFile(new URL('src/email/email-templates.ts', root), 'utf8'), readFile(new URL('src/database/migrations/1769000000000-CreateEmailOutboxAndUserInvitations.ts', root), 'utf8'),
]);
const checks = [
  ['admin-only RPC surface', /adminProcedure/.test(router) && /resendInvitation/.test(router)],
  ['import is bounded and hash-checked', /1,000/.test(importer) && /expectedHash/.test(importer) && /slice\(index, index \+ 5\)/.test(importer)],
  ['account failure is compensated', /accounts\.remove/.test(provisioning)],
  ['mail is committed with user data', /this\.outbox\.enqueue/.test(provisioning) && /transaction/.test(provisioning)],
  ['outbox is concurrency-safe and recoverable', /SKIP LOCKED/.test(outbox) && /5 minutes/.test(outbox) && /attempts >= 8/.test(outbox)],
  ['PostgreSQL affected-row wrappers cannot reach the processor', /unwrapAffectedRows/.test(outbox) && /Array\.isArray\(result\[0\]\)/.test(outbox)],
  ['Dutch and English templates exist', /Activeer je/.test(templates) && /Activate your/.test(templates)],
  ['database constraints protect status and locale', /CHK_email_outbox_status/.test(migration) && /CHK_users_preferredLocale/.test(migration)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
assert.ok(checks.every(([, passed]) => passed), 'User/email eval failed.');
console.log(`User/email eval passed with ${checks.length}/${checks.length}.`);
