# User search regression checks

Outcome: searches by display name, first name, last name and email succeed on PostgreSQL while excluding former members. Accounts without a user_information row remain searchable.

TypeORM query conditions must use entity property paths (`user.firstName`). Mixing raw quoted column names with the reserved alias (`user."firstName"`) bypasses TypeORM's alias quoting and produces PostgreSQL's `syntax error at or near "."`.

Fast gate from the repository root:

```sh
rtk pnpm --filter @repo/rpc exec jest --runInBand --coverage=false users.repository.spec.ts
```

Database eval, with TEST_USER_SEARCH_DATABASE_URL pointing to a local PostgreSQL test database:

```sh
rtk pnpm --filter @repo/rpc exec node scripts/check-user-search-eval.mjs
```

The eval requires every case to pass: trimmed/case-insensitive first name, last name, display name, email, empty search, inactive membership exclusion, missing information rows, SQL-like input and result limit. It uses connection-local temporary tables and leaves persistent tables unchanged. No LLM calls are needed for this deterministic behavior.

For future query failures: reproduce using the real repository on PostgreSQL, inspect `getQueryAndParameters()`, fix property paths, then run both checks. Mock query-builder assertions alone do not validate SQL syntax.
