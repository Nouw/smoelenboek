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
MAIL_FROM=Smoelenboek <noreply@smoelenboek.local>
MAILPIT_HTTP_URL=http://127.0.0.1:8025
```

View messages at <http://127.0.0.1:8025>. Run the optional transport smoke test
with `RUN_MAILPIT_SMOKE=1 pnpm --filter @repo/rpc test:e2e -- mailpit.smoke.spec.ts`.

## Templates

Templates receive semantic data (`name`, `url`) and are rendered in Dutch or
English. Preview the invitation at <http://localhost:3004> with:

```bash
pnpm --filter @repo/rpc email:preview
```

Add future message types by extending `EmailMessageType`, localized copy in
`email-templates.ts`, and an outbox producer. Never log template payloads or URLs.
