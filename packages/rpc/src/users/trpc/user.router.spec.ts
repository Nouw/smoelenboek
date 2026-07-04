import { TRPCError } from '@trpc/server';
import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../../router';

describe('user tRPC router', () => {
  it('rejects user.me without authentication', async () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    });
    const caller = appRouter.createCaller({
      userId: null,
      sessionId: null,
      orgId: null,
      authType: null,
      claims: null,
    });

    await expect(caller.user.me()).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches user.me through the query bus', async () => {
    const execute = jest.fn().mockResolvedValue(null);
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });
    const caller = appRouter.createCaller({
      userId: 'user_123',
      sessionId: 'sess_123',
      orgId: null,
      authType: 'session',
      claims: { sub: 'user_123' },
    });

    await expect(caller.user.me()).resolves.toBeNull();
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_123' }),
    );
  });
});
