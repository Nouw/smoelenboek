import { describe, expect, it, jest } from '@jest/globals';

import { SyncUserFromClerkCommand } from './sync-user-from-clerk.command';
import { SyncUserFromClerkHandler } from './sync-user-from-clerk.handler';

const now = new Date('2026-06-27T00:00:00.000Z');

describe('SyncUserFromClerkHandler', () => {
  it('syncs a Clerk projection through the repository', async () => {
    const syncFromClerk = jest.fn().mockResolvedValue({
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      clerkUserId: 'user_123',
      email: 'julien@example.com',
      firstName: 'Julien',
      lastName: null,
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    });
    const handler = new SyncUserFromClerkHandler({
      syncFromClerk,
    } as never);

    await expect(
      handler.execute(
        new SyncUserFromClerkCommand('user_123', {
          email: 'julien@example.com',
          first_name: 'Julien',
        }),
      ),
    ).resolves.toEqual({
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      clerkUserId: 'user_123',
      email: 'julien@example.com',
      firstName: 'Julien',
      lastName: null,
      imageUrl: null,
      createdAt: '2026-06-27T00:00:00.000Z',
      updatedAt: '2026-06-27T00:00:00.000Z',
    });

    expect(syncFromClerk).toHaveBeenCalledWith({
      clerkUserId: 'user_123',
      claims: {
        email: 'julien@example.com',
        first_name: 'Julien',
      },
    });
  });
});
