import { TRPCError } from '@trpc/server';
import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../src/router';

describe('user tRPC e2e', () => {
  it('protects the current-user query at the router boundary', async () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter
        .createCaller({
          userId: null,
          sessionId: null,
          orgId: null,
          authType: null,
      role: null,
      claims: null,
        })
        .user.me(),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
