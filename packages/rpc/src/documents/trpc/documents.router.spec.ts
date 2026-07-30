import { TRPCError } from '@trpc/server';
import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../../router';

const memberContext = {
  userId: 'user_123',
  sessionId: 'session_123',
  orgId: null,
  authType: 'session' as const,
  role: 'user',
  passwordMigrationRequired: false,
  claims: { sub: 'user_123' },
};

describe('documents tRPC router', () => {
  it('allows members to browse season-scoped collections', async () => {
    const execute = jest.fn().mockResolvedValue([]);
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });

    await expect(
      appRouter.createCaller(memberContext).documents.listCollections({
        seasonKey: 2025,
        kind: 'document_library',
      }),
    ).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        seasonKey: 2025,
        kind: 'document_library',
      }),
    );
  });

  it('rejects member mutations before dispatching a command', async () => {
    const execute = jest.fn();
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter.createCaller(memberContext).documents.createCollection({
        name: 'Team maps',
        kind: 'document_library',
        seasonKey: 2025,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(execute).not.toHaveBeenCalled();
  });

  it('keeps reorder operations admin-only', async () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter.createCaller(memberContext).documents.reorderCollections({
        seasonKey: 2025,
        kind: 'photo_album',
        collectionIds: [],
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
