# Local database

The tRPC service owns the local PostgreSQL database.

## Configure env

```sh
cp apps/web/.env.example apps/web/.env.local
cp services/rpc/.env.example services/rpc/.env.local
```

Fill in the Clerk values in both files before using authenticated flows.

## Start Postgres

```sh
docker compose up -d postgres
```

## Run migrations

```sh
pnpm --filter @repo/rpc migration:run
```

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
