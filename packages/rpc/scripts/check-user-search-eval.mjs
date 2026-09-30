import { spawnSync } from 'node:child_process';

if (!process.env.TEST_USER_SEARCH_DATABASE_URL) {
  throw new Error('Set TEST_USER_SEARCH_DATABASE_URL to a local PostgreSQL test database.');
}

const result = spawnSync('pnpm', ['exec', 'jest', '--config', './test/jest-e2e.json', '--runInBand', 'user-search.e2e-spec.ts'], {
  cwd: new URL('../', import.meta.url),
  env: process.env,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
