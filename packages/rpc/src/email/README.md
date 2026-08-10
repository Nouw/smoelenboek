# Email delivery

Transactional email is queued in PostgreSQL before delivery. `EmailOutboxProcessor`
claims rows with `FOR UPDATE SKIP LOCKED`, reclaims work after a crashed worker,
and retries delivery eight times. SMTP delivery is at-least-once.

## Local Mailpit

Mailpit is intentionally not part of this repository's Docker Compose file. Start
your machine-managed Mailpit instance, then configure `packages/rpc/.env.local`:

```dotenv
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_REQUIRE_TLS=false
MAIL_REJECT_UNAUTHORIZED=true
MAIL_FROM=Smoelenboek <noreply@smoelenboek.local>
MAILPIT_HTTP_URL=http://127.0.0.1:8025
```

View messages at <http://127.0.0.1:8025>. Run the optional transport smoke test
with `RUN_MAILPIT_SMOKE=1 pnpm --filter @repo/rpc test:e2e -- mailpit.smoke.spec.ts`.

## Production SMTP

Production starts only when the SMTP configuration is explicit, authenticated,
encrypted, and certificate-verified. For a provider using STARTTLS on port 587:

```dotenv
NODE_ENV=production
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_REQUIRE_TLS=true
MAIL_REJECT_UNAUTHORIZED=true
MAIL_FROM=Smoelenboek <members@example.com>
MAIL_USER=smtp-user
MAIL_PASSWORD=smtp-password-from-the-secret-store
MAIL_CONNECTION_TIMEOUT_MS=10000
MAIL_GREETING_TIMEOUT_MS=10000
MAIL_SOCKET_TIMEOUT_MS=60000
```

For implicit TLS on port 465, set `MAIL_PORT=465`, `MAIL_SECURE=true`, and
`MAIL_REQUIRE_TLS=false`. The password must come from the deployment secret
store and must never be committed to an environment file.

At startup, the RPC service authenticates with the SMTP server using
Nodemailer's `verify()` operation. Startup fails on bad credentials, TLS or DNS
errors, or an unreachable server. Successful verification emits the structured
`email.smtp_verified` event without credentials. Delivery continues through the
PostgreSQL outbox, with its existing retry and terminal-failure behavior.

The SMTP provider and sending domain must also be configured outside this
repository:

- Publish the provider's SPF record.
- Enable DKIM signing at the provider and publish its DKIM records.
- Publish a DMARC policy and monitor aggregate reports before enforcing reject.
- Verify that `MAIL_FROM` belongs to an authenticated sending domain.
- Configure alerts for terminal `email.delivery_failed` records and a growing
  pending outbox.

This adapter supports username/password SMTP AUTH. If the selected provider
requires OAuth 2.0 instead, add an OAuth transport configuration before using
that provider.

### Production validation

The service rejects startup when:

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`, `MAIL_USER`, or `MAIL_PASSWORD` is
  missing.
- Only one SMTP credential is present.
- STARTTLS is disabled while implicit TLS is not enabled.
- Certificate verification is disabled.
- The port, timeout, boolean, or sender-address format is invalid.

## Templates

Templates receive semantic data (`name`, `url`) and are rendered in Dutch or
English. Preview the invitation at <http://localhost:3004> with:

```bash
pnpm --filter @repo/rpc email:preview
```

Add future message types by extending `EmailMessageType`, localized copy in
`email-templates.ts`, and an outbox producer. Never log template payloads or URLs.
