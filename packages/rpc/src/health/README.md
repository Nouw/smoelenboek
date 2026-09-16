# RPC health

`GET /health` is the unauthenticated readiness endpoint for container orchestration and external
OneUptime monitoring. It performs `SELECT 1` through the application's TypeORM data source and
returns `200` only while PostgreSQL is reachable. Dependency failure returns `503` without leaking
connection details.
