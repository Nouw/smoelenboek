# Local database

The tRPC service owns the local PostgreSQL database.

## Start Postgres

```sh
docker compose up -d postgres
```

## Run migrations

```sh
DATABASE_URL=postgresql://smoelenboek:smoelenboek@localhost:5432/smoelenboek pnpm --filter @repo/rpc migration:run
```

## Run the RPC service

```sh
DATABASE_URL=postgresql://smoelenboek:smoelenboek@localhost:5432/smoelenboek CLERK_SECRET_KEY=<value> pnpm --filter @repo/rpc dev
```

The service listens on `http://localhost:3002/trpc`.
