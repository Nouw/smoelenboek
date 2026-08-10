import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [
  router,
  importer,
  provisioning,
  outbox,
  templates,
  migration,
  env,
  smtpConfig,
  smtpSender,
  legacyPassword,
  betterAuth,
  legacyPasswordMigration,
  legacyPasswordResetCleanup,
  authorization,
  webShell,
  mediaAssets,
  sponsorhengel,
] = await Promise.all([
  readFile(new URL('src/users/trpc/user.router.ts', root), 'utf8'),
  readFile(new URL('src/users/import/user-import.service.ts', root), 'utf8'),
  readFile(
    new URL('src/users/services/user-provisioning.service.ts', root),
    'utf8',
  ),
  readFile(new URL('src/email/email-outbox.repository.ts', root), 'utf8'),
  readFile(new URL('src/email/email-templates.ts', root), 'utf8'),
  readFile(
    new URL(
      'src/database/migrations/1769000000000-CreateEmailOutboxAndUserInvitations.ts',
      root,
    ),
    'utf8',
  ),
  readFile(new URL('src/config/env.ts', root), 'utf8'),
  readFile(new URL('src/email/smtp-email.config.ts', root), 'utf8'),
  readFile(new URL('src/email/smtp-email.sender.ts', root), 'utf8'),
  readFile(new URL('src/auth/legacy-password-migration.ts', root), 'utf8'),
  readFile(new URL('src/auth/better-auth-instance.ts', root), 'utf8'),
  readFile(
    new URL(
      'src/database/migrations/1769700000000-AddLegacyPasswordMigrationState.ts',
      root,
    ),
    'utf8',
  ),
  readFile(
    new URL(
      'src/database/migrations/1769800000000-DropLegacyPasswordResetDeliveryState.ts',
      root,
    ),
    'utf8',
  ),
  readFile(new URL('src/trpc/init.ts', root), 'utf8'),
  readFile(new URL('../../apps/web/app/app-shell.tsx', root), 'utf8'),
  readFile(new URL('src/media/content-asset.controller.ts', root), 'utf8'),
  readFile(
    new URL('src/sponsorhengel/sponsorhengel.controller.ts', root),
    'utf8',
  ),
]);
const checks = [
  [
    'admin-only RPC surface',
    /adminProcedure/.test(router) && /resendInvitation/.test(router),
  ],
  [
    'import is bounded and hash-checked',
    /1,000/.test(importer) &&
      /expectedHash/.test(importer) &&
      /slice\(index, index \+ 5\)/.test(importer),
  ],
  ['account failure is compensated', /accounts\.remove/.test(provisioning)],
  [
    'mail is committed with user data',
    /this\.outbox\.enqueue/.test(provisioning) &&
      /transaction/.test(provisioning),
  ],
  [
    'outbox is concurrency-safe and recoverable',
    /SKIP LOCKED/.test(outbox) &&
      /5 minutes/.test(outbox) &&
      /attempts >= 8/.test(outbox),
  ],
  [
    'PostgreSQL affected-row wrappers cannot reach the processor',
    /unwrapAffectedRows/.test(outbox) &&
      /Array\.isArray\(result\[0\]\)/.test(outbox),
  ],
  [
    'Dutch and English templates exist',
    /Activeer je/.test(templates) && /Activate your/.test(templates),
  ],
  [
    'database constraints protect status and locale',
    /CHK_email_outbox_status/.test(migration) &&
      /CHK_users_preferredLocale/.test(migration),
  ],
  [
    'production SMTP requires authentication and TLS',
    /SMTP authentication is required in production/.test(env) &&
      /MAIL_REQUIRE_TLS must be true/.test(env) &&
      /MAIL_REJECT_UNAUTHORIZED cannot be false/.test(env),
  ],
  [
    'SMTP transport verifies certificates and blocks external content loading',
    /minVersion: 'TLSv1.2'/.test(smtpConfig) &&
      /rejectUnauthorized/.test(smtpConfig) &&
      /disableFileAccess: true/.test(smtpConfig) &&
      /disableUrlAccess: true/.test(smtpConfig),
  ],
  [
    'production startup verifies SMTP without leaking server responses',
    /transporter\.verify/.test(smtpSender) &&
      /smtpErrorCode/.test(smtpSender) &&
      !/error\.message/.test(smtpSender),
  ],
  [
    'SMTP delivery failures are sanitized before outbox persistence',
    /SMTP delivery failed/.test(smtpSender) && !/throw error/.test(smtpSender),
  ],
  [
    'legacy bcrypt is verified without bypassing Better Auth for modern hashes',
    /compare\(password, hash\)/.test(legacyPassword) &&
      /return verifyModern\(\{ password, hash \}\)/.test(legacyPassword),
  ],
  [
    'legacy login keeps its Better Auth session',
    /passwordMigrationRequired/.test(betterAuth) &&
      /onPasswordReset/.test(betterAuth) &&
      /completePasswordMigration/.test(betterAuth) &&
      !/sendMigrationResetIfDue/.test(betterAuth) &&
      !/deleteSession/.test(betterAuth),
  ],
  [
    'legacy credential state is restored and backfilled by a forward migration',
    /ADD COLUMN IF NOT EXISTS "passwordMigrationRequired"/.test(
      legacyPasswordMigration,
    ) &&
      /account\."providerId" = 'credential'/.test(legacyPasswordMigration) &&
      /account\."password" ~/.test(legacyPasswordMigration) &&
      !/legacy_user_migration_map/.test(legacyPasswordMigration),
  ],
  [
    'forced-reset delivery state is removed',
    /DROP COLUMN IF EXISTS "passwordMigrationResetSentAt"/.test(
      legacyPasswordResetCleanup,
    ),
  ],
  [
    'legacy sessions retain application access',
    !/if \(ctx\.passwordMigrationRequired\)/.test(authorization) &&
      !/migratedUser/.test(webShell) &&
      !/context\.passwordMigrationRequired/.test(mediaAssets) &&
      !/context\.passwordMigrationRequired/.test(sponsorhengel),
  ],
];
for (const [name, passed] of checks)
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
assert.ok(
  checks.every(([, passed]) => passed),
  'User/email eval failed.',
);
console.log(`User/email eval passed with ${checks.length}/${checks.length}.`);
