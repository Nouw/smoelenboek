import { describe, expect, it } from '@jest/globals';

import type { TrpcContext } from './context';
import { adminProcedure, protectedProcedure, router } from './init';

const testRouter = router({
  protectedValue: protectedProcedure.query(() => 'available'),
  adminValue: adminProcedure.query(() => 'available'),
});

function context(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    userId: 'user-id',
    sessionId: 'session-id',
    orgId: null,
    authType: 'session',
    role: 'user',
    passwordMigrationRequired: false,
    claims: { sub: 'user-id' },
    ...overrides,
  };
}

describe('protectedProcedure', () => {
  it('allows authenticated users with modern passwords', async () => {
    await expect(
      testRouter.createCaller(context()).protectedValue(),
    ).resolves.toBe('available');
  });

  it('allows authenticated users whose credential still uses a legacy hash', async () => {
    await expect(
      testRouter
        .createCaller(context({ passwordMigrationRequired: true }))
        .protectedValue(),
    ).resolves.toBe('available');
  });

  it('allows only administrators through admin procedures', async () => {
    await expect(
      testRouter
        .createCaller({
          ...context({ role: 'admin' }),
          passwordMigrationRequired: true,
        })
        .adminValue(),
    ).resolves.toBe('available');
    await expect(
      testRouter.createCaller(context({ role: 'user' })).adminValue(),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
