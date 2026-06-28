import { describe, expect, it, jest } from '@jest/globals';

import { SyncUserFromClerkCommand } from './sync-user-from-clerk.command';
import { SyncUserFromClerkHandler } from './sync-user-from-clerk.handler';

const now = new Date('2026-06-27T00:00:00.000Z');

describe('SyncUserFromClerkHandler', () => {
  it('appends a Clerk sync event and projects the user', async () => {
    const projectedUser = {
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      clerkUserId: 'user_123',
      email: 'julien@example.com',
      firstName: 'Julien',
      lastName: null,
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    const appendAndProject = jest.fn(async (_event, projector) =>
      projector({ id: 'event_123' }, { manager: true }),
    );
    const projectSyncedFromClerk = jest.fn().mockResolvedValue(projectedUser);
    const handler = new SyncUserFromClerkHandler(
      { appendAndProject } as never,
      { projectSyncedFromClerk } as never,
    );

    await expect(
      handler.execute(
        new SyncUserFromClerkCommand('user_123', {
          email: 'julien@example.com',
          first_name: 'Julien',
          last_name: '',
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

    expect(appendAndProject).toHaveBeenCalledWith(
      {
        aggregateType: 'user',
        aggregateId: 'user_123',
        eventType: 'user.synced_from_clerk',
        eventVersion: 1,
        payload: {
          clerkUserId: 'user_123',
          email: 'julien@example.com',
          firstName: 'Julien',
          lastName: null,
          imageUrl: null,
        },
        metadata: {
          source: 'clerk',
        },
      },
      expect.any(Function),
    );
    expect(projectSyncedFromClerk).toHaveBeenCalledWith(
      {
        clerkUserId: 'user_123',
        email: 'julien@example.com',
        firstName: 'Julien',
        lastName: null,
        imageUrl: null,
      },
      { manager: true },
    );
  });
});
