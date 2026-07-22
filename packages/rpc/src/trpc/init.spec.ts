import { describe, expect, it } from '@jest/globals';

import type { TrpcContext } from './context';
import { protectedProcedure, router } from './init';

const testRouter = router({
  protectedValue: protectedProcedure.query(() => 'available'),
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

  it('blocks migrated users until their password is reset', async () => {
    await expect(
      testRouter
        .createCaller(context({ passwordMigrationRequired: true }))
        .protectedValue(),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'A password reset is required before using the application.',
    });
  });
});
