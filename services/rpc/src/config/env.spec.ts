import { describe, expect, it } from '@jest/globals';

import { validateRpcEnv } from './env';

describe('validateRpcEnv', () => {
  it('requires DATABASE_URL', () => {
    expect(() =>
      validateRpcEnv({
        CLERK_SECRET_KEY: 'sk_test_123',
      }),
    ).toThrow('DATABASE_URL is required for services/rpc.');
  });

  it('requires CLERK_SECRET_KEY', () => {
    expect(() =>
      validateRpcEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      }),
    ).toThrow('CLERK_SECRET_KEY is required for services/rpc.');
  });

  it('applies runtime defaults', () => {
    expect(
      validateRpcEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
        CLERK_SECRET_KEY: 'sk_test_123',
      }),
    ).toEqual({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      CLERK_SECRET_KEY: 'sk_test_123',
      WEB_ORIGIN: 'http://localhost:3001',
      PORT: '3002',
    });
  });
});
