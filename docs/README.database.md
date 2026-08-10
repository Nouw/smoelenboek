# Local database

The tRPC service owns the local PostgreSQL database.

## Configure env

```sh
cp apps/web/.env.example apps/web/.env.local
cp packages/rpc/.env.example packages/rpc/.env.local
```

Generate a `BETTER_AUTH_SECRET` with `openssl rand -base64 32` for the RPC
service before using authenticated flows. The web app only needs public URLs;
Better Auth sessions and API keys are owned by the RPC service.

## Start Postgres

```sh
docker compose up -d postgres
```

Postgres is exposed on host port `5433` to avoid conflicts with a local
Postgres installation on `5432`.

## Run migrations

```sh
pnpm --filter @repo/rpc migration:run
```

The season-key migration preserves former team and committee memberships and
removes the old generated `seasons` table. It is intentionally one-way because
reverting to hard-deleted memberships would discard that restored history.

Its PostgreSQL restoration fixture runs when a disposable empty database is
provided:

```sh
TEST_SEASON_MIGRATION_DATABASE_URL=postgresql://... \
  pnpm --filter @repo/rpc test:e2e --runInBand
```

The Protototo schema and entry fixture can be verified against another empty,
disposable PostgreSQL database:

```sh
TEST_PROTOTOTO_DATABASE_URL=postgresql://... \
  pnpm --filter @repo/rpc test:e2e --runInBand protototo.e2e-spec.ts
```

## Seasons and membership history

Seasons follow one association-wide policy in the `Europe/Amsterdam` calendar:
August 1 through the next August 1, with the end date excluded. The numeric
`seasonKey` is the first calendar year, so `2025` represents `2025/2026`.

Season records are computed and never generated or administered. New team and
committee memberships default to the current season. Imports and advance
planning can provide an explicit `seasonKey` and `startedOn` date. `createdAt`
remains an audit timestamp and is never used to determine membership history.

Removing a team membership deletes its roster projection immediately. The
stored removal event remains as the audit record, but the membership no longer
appears in team rosters or user history. Committee membership endings continue
to use `endedOn` and retain their projected history.

Teams have a required `men` or `women` category. The category migration
backfills existing `Heren` and `Dames` records and their stored snapshot events.
It intentionally aborts when a team name cannot be classified so no team is
silently placed in the wrong directory. Rename unclassified records before
rerunning the migration.

Administrators may manage any numeric season key from 1900 through 3000. New
memberships require an explicit start date inside that season. Removing a team
member requires only the membership identifier and takes effect immediately.

## User information

Authentication fields, names, roles, and profile images remain in `users`.
Association-specific details are stored one-to-one in `user_information` and
are created when information is first added. No personal information is seeded
or copied from a legacy database by the migration.

Authenticated members can read another member's association information. A
bank account number is returned only to that user or an admin. Users can update
their own information, while admins can update any user. Updates are retained
as `user.information_updated` events, including bank account changes.

## Create a login user

Public registration is disabled. Create users through the RPC admin command:

```sh
pnpm --filter @repo/rpc auth:create-user -- --email fabio@example.com --password "password1234" --name "Fabio"
```

The command uses Better Auth's email/password flow and prints the created user
without printing the password.

## Legacy passwords

Credential accounts may temporarily contain a bcrypt hash copied from the
previous application. Migration `1769700000000` detects `$2a$`, `$2b$`, and
`$2y$` bcrypt hashes, plus the old `reset` sentinel, and marks those users as
requiring password migration.

A correct legacy password creates a normal Better Auth session with the same
application access and role checks as a modern credential. Signing in does not
send a password-reset email. The migration flag remains set while the bcrypt
credential is in use, but it does not restrict application access.

When the user requests a password reset, the normal email flow is used. The
migration flag is cleared only after Better Auth successfully stores the
replacement password, at which point all existing sessions are revoked and
future logins use Better Auth's current password verifier. Failed or abandoned
reset attempts therefore leave the working bcrypt credential unchanged.

Legacy credential records must use `account.providerId = 'credential'` and keep
the original bcrypt value in `account.password`. Do not pre-hash the bcrypt
value again. Run the normal database migrations after importing those records
so the migration state is backfilled.

## Create an API key

Create API keys through the RPC admin command. You can target a user by email:

```sh
pnpm --filter @repo/rpc auth:create-api-key -- --email fabio@example.com --name "Docs key"
```

Or by user id:

```sh
pnpm --filter @repo/rpc auth:create-api-key -- --user-id 9c58d578-5068-4eb7-9e1c-088a44d9f520 --name "Docs key"
```

Optional flags:

```sh
--prefix sml
--expires-in 2592000
--metadata '{"source":"cli"}'
--rate-limit-enabled true
--rate-limit-max 100
--rate-limit-window 60000
--remaining 1000
```

The command prints the full API key once. Store it immediately; Better Auth
stores only the hashed key.

## Run the RPC service

```sh
pnpm --filter @repo/rpc dev
```

The service listens on `http://localhost:3002/trpc`.

## Run the web app

```sh
pnpm --filter web dev
```

The web app reads only `NEXT_PUBLIC_*` values from `apps/web/.env.local`.
