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
      role: null,
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
      role: 'user',
      claims: { sub: 'user_123' },
    });

    await expect(caller.user.me()).resolves.toBeNull();
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_123' }),
    );
  });

  it('rejects user.byId without authentication', async () => {
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

    await expect(
      caller.user.byId({
        userId: '6a0d03df-8c89-4309-b4ce-d1344f801b06',
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches user.byId for the requested user ID', async () => {
    const execute = jest.fn().mockResolvedValue(null);
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });
    const caller = appRouter.createCaller(authenticatedContext('user'));
    const targetUserId = '6a0d03df-8c89-4309-b4ce-d1344f801b06';

    await expect(
      caller.user.byId({ userId: targetUserId }),
    ).resolves.toBeNull();
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: targetUserId }),
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
      role: null,
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
      role: 'user',
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
      role: 'user',
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

describe('user information tRPC routes', () => {
  it('dispatches a read for another member with actor context', async () => {
    const execute = jest.fn().mockResolvedValue(null);
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });
    const caller = appRouter.createCaller(authenticatedContext('user'));
    const targetUserId = '6a0d03df-8c89-4309-b4ce-d1344f801b06';

    await expect(
      caller.user.information({ userId: targetUserId }),
    ).resolves.toBeNull();
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        actorRole: 'user',
        targetUserId,
      }),
    );
  });

  it('dispatches a validated owner update through the command bus', async () => {
    const execute = jest.fn().mockResolvedValue(informationOutput());
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });
    const caller = appRouter.createCaller(authenticatedContext('user'));

    await expect(
      caller.user.updateInformation({
        changes: { city: '  Utrecht  ', backNumber: 8 },
      }),
    ).resolves.toMatchObject({ city: 'Utrecht', backNumber: 8 });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        actorRole: 'user',
        targetUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        changes: { city: 'Utrecht', backNumber: 8 },
      }),
    );
  });

  it('rejects an update without changed fields', async () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    });
    const caller = appRouter.createCaller(authenticatedContext('user'));

    await expect(
      caller.user.updateInformation({ changes: {} }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});

describe('user search tRPC route', () => {
  it('rejects searches without authentication', async () => {
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
        .user.search({ query: 'Example' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('allows authenticated members and dispatches a trimmed search', async () => {
    const execute = jest.fn().mockResolvedValue([
      {
        id: '6a0d03df-8c89-4309-b4ce-d1344f801b06',
        name: 'Example Member',
        email: 'member@example.com',
        imageUrl: null,
      },
    ]);
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });

    await expect(
      appRouter.createCaller(authenticatedContext('user')).user.search({
        query: '  Example  ',
      }),
    ).resolves.toHaveLength(1);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'Example' }),
    );
  });
});

function authenticatedContext(role: string) {
  return {
    userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
    sessionId: 'sess_123',
    orgId: null,
    authType: 'session' as const,
    role,
    claims: { sub: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd', role },
  };
}

function informationOutput() {
  return {
    userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
    streetName: null,
    houseNumber: null,
    postcode: null,
    city: 'Utrecht',
    phoneNumber: null,
    bankAccountNumber: null,
    birthDate: null,
    bondNumber: null,
    joinDate: null,
    leaveDate: null,
    backNumber: 8,
    refereeLicense: null,
    createdAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
  };
}

describe('user administration tRPC routes', () => {
  it('rejects member access and dispatches normalized creation for admins', async () => {
    const appRouter = createAppRouter({ commandBus: { execute: jest.fn() } as never, queryBus: { execute: jest.fn() } as never });
    await expect(appRouter.createCaller(authenticatedContext('user')).user.admin.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const execute = jest.fn().mockResolvedValue({
      id: '6a0d03df-8c89-4309-b4ce-d1344f801b06', email: 'member@example.com', name: 'Example Member',
      preferredLocale: 'nl', invitedAt: '2026-08-07T10:00:00.000Z', accountActivatedAt: null, invitationStatus: 'pending',
    });
    const adminRouter = createAppRouter({ commandBus: { execute } as never, queryBus: { execute: jest.fn() } as never });
    await expect(adminRouter.createCaller(authenticatedContext('admin')).user.admin.create({
      email: 'MEMBER@example.com', firstName: 'Example', lastName: 'Member', preferredLocale: 'nl',
    })).resolves.toMatchObject({ email: 'member@example.com', invitationStatus: 'pending' });
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd', input: expect.objectContaining({ email: 'member@example.com' }) }));
  });
});
