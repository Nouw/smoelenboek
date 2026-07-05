import { describe, expect, it, jest } from '@jest/globals';

import { SyncUserFromAuthCommand } from './sync-user-from-auth.command';
import { SyncUserFromAuthHandler } from './sync-user-from-auth.handler';

const now = new Date('2026-06-27T00:00:00.000Z');

describe('SyncUserFromAuthHandler', () => {
  it('appends an auth sync event and projects the user', async () => {
    const projectedUser = {
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      email: 'julien@example.com',
      emailVerified: true,
      name: 'Julien Example',
      firstName: 'Julien',
      lastName: null,
      imageUrl: null,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    };
    const appendAndProject = jest.fn(async (_event, projector) =>
      projector({ id: 'event_123' }, { manager: true }),
    );
    const projectSyncedFromAuth = jest.fn().mockResolvedValue(projectedUser);
    const handler = new SyncUserFromAuthHandler(
      { appendAndProject } as never,
      { projectSyncedFromAuth } as never,
    );

    await expect(
      handler.execute(
        new SyncUserFromAuthCommand(
          '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          {
            sub: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
            email: 'julien@example.com',
            email_verified: true,
            name: 'Julien Example',
            first_name: 'Julien',
            last_name: '',
            role: 'admin',
          },
        ),
      ),
    ).resolves.toEqual({
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      email: 'julien@example.com',
      emailVerified: true,
      name: 'Julien Example',
      firstName: 'Julien',
      lastName: null,
      imageUrl: null,
      role: 'admin',
      createdAt: '2026-06-27T00:00:00.000Z',
      updatedAt: '2026-06-27T00:00:00.000Z',
    });

    expect(appendAndProject).toHaveBeenCalledWith(
      {
        aggregateType: 'user',
        aggregateId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        eventType: 'user.synced_from_auth',
        eventVersion: 1,
        payload: {
          userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          email: 'julien@example.com',
          emailVerified: true,
          name: 'Julien Example',
          firstName: 'Julien',
          lastName: null,
          imageUrl: null,
          role: 'admin',
        },
        metadata: {
          source: 'better-auth',
        },
      },
      expect.any(Function),
    );
    expect(projectSyncedFromAuth).toHaveBeenCalledWith(
      {
        userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        email: 'julien@example.com',
        emailVerified: true,
        name: 'Julien Example',
        firstName: 'Julien',
        lastName: null,
        imageUrl: null,
        role: 'admin',
      },
      { manager: true },
    );
  });
});
