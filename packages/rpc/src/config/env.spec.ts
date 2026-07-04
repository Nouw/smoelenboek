import { describe, expect, it } from '@jest/globals';

import { validateRpcEnv } from './env';

describe('validateRpcEnv', () => {
  it('requires DATABASE_URL', () => {
    expect(() =>
      validateRpcEnv({
        BETTER_AUTH_SECRET: 'better-auth-secret-with-32-characters',
        BETTER_AUTH_URL: 'http://localhost:3002',
      }),
    ).toThrow('DATABASE_URL is required for packages/rpc.');
  });

  it('requires BETTER_AUTH_SECRET', () => {
    expect(() =>
      validateRpcEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
        BETTER_AUTH_URL: 'http://localhost:3002',
      }),
    ).toThrow('BETTER_AUTH_SECRET is required for packages/rpc.');
  });

  it('requires BETTER_AUTH_URL', () => {
    expect(() =>
      validateRpcEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
        BETTER_AUTH_SECRET: 'better-auth-secret-with-32-characters',
      }),
    ).toThrow('BETTER_AUTH_URL is required for packages/rpc.');
  });

  it('applies runtime defaults', () => {
    expect(
      validateRpcEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
        BETTER_AUTH_SECRET: 'better-auth-secret-with-32-characters',
        BETTER_AUTH_URL: 'http://localhost:3002',
      }),
    ).toEqual({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      BETTER_AUTH_SECRET: 'better-auth-secret-with-32-characters',
      BETTER_AUTH_URL: 'http://localhost:3002',
      WEB_ORIGIN: 'http://localhost:3001',
      PORT: '3002',
    });
  });
});
