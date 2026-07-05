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

## Create a login user

Public registration is disabled. Create users through the RPC admin command:

```sh
pnpm --filter @repo/rpc auth:create-user -- --email fabio@example.com --password "password1234" --name "Fabio"
```

The command uses Better Auth's email/password flow and prints the created user
without printing the password.

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
