import { describe, expect, it, jest } from '@jest/globals';
import { createAppRouter } from '../../router';
import { TRPCError } from '@trpc/server';

describe('data tRPC router', () => {
  it('rejects data.birthdays without authentication', async () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    const caller = appRouter.createCaller({
      userId: null,
      sessionId: null,
      orgId: null,
      authType: null,
      role: null,
      claims: null,
    });

    await expect(caller.data.birthdays()).rejects.toBeInstanceOf(TRPCError)
  })
})
