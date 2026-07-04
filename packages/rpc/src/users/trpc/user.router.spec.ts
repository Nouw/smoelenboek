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

  it('rejects user.updateProfile without authentication', async () => {
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

    await expect(
      caller.user.updateProfile({ imageUrl: 'https://example.com/a.png' }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches user.updateProfile through the command bus with input', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      email: 'user@example.com',
      emailVerified: true,
      name: 'User',
      firstName: 'User',
      lastName: null,
      imageUrl: 'https://example.com/new.png',
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    });
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });
    const caller = appRouter.createCaller({
      userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      sessionId: 'sess_123',
      orgId: null,
      authType: 'session',
      claims: { sub: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd' },
    });

    await expect(
      caller.user.updateProfile({ imageUrl: 'https://example.com/new.png' }),
    ).resolves.toEqual(
      expect.objectContaining({
        imageUrl: 'https://example.com/new.png',
      }),
    );
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        input: { imageUrl: 'https://example.com/new.png' },
      }),
    );
  });
});
