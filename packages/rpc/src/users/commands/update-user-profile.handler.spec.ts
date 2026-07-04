import { describe, expect, it, jest } from '@jest/globals';

import { UpdateUserProfileCommand } from './update-user-profile.command';
import { UpdateUserProfileHandler } from './update-user-profile.handler';

const now = new Date('2026-07-04T00:00:00.000Z');

describe('UpdateUserProfileHandler', () => {
  it('appends a profile-updated event and projects the user', async () => {
    const projectedUser = {
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      email: 'julien@example.com',
      emailVerified: true,
      name: 'Julien Example',
      firstName: 'Julien',
      lastName: null,
      imageUrl: 'https://example.com/new-avatar.png',
      createdAt: now,
      updatedAt: now,
    };
    const appendAndProject = jest.fn(async (_event, projector) =>
      projector({ id: 'event_456' }, { manager: true }),
    );
    const projectProfileUpdated = jest.fn().mockResolvedValue(projectedUser);
    const handler = new UpdateUserProfileHandler(
      { appendAndProject } as never,
      { projectProfileUpdated } as never,
    );

    await expect(
      handler.execute(
        new UpdateUserProfileCommand(
          '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          { imageUrl: 'https://example.com/new-avatar.png' },
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
      imageUrl: 'https://example.com/new-avatar.png',
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    });

    expect(appendAndProject).toHaveBeenCalledWith(
      {
        aggregateType: 'user',
        aggregateId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        eventType: 'user.profile_updated',
        eventVersion: 1,
        payload: {
          userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          imageUrl: 'https://example.com/new-avatar.png',
        },
        metadata: {
          source: 'user',
        },
      },
      expect.any(Function),
    );
    expect(projectProfileUpdated).toHaveBeenCalledWith(
      {
        userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        imageUrl: 'https://example.com/new-avatar.png',
      },
      { manager: true },
    );
  });

  it('handles null imageUrl', async () => {
    const projectedUser = {
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      authUserId: null,
      email: 'julien@example.com',
      emailVerified: false,
      name: 'Julien',
      firstName: null,
      lastName: null,
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    const appendAndProject = jest.fn(async (_event, projector) =>
      projector({ id: 'event_789' }, { manager: true }),
    );
    const projectProfileUpdated = jest.fn().mockResolvedValue(projectedUser);
    const handler = new UpdateUserProfileHandler(
      { appendAndProject } as never,
      { projectProfileUpdated } as never,
    );

    await expect(
      handler.execute(
        new UpdateUserProfileCommand(
          '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          { imageUrl: null },
        ),
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        imageUrl: null,
      }),
    );

    expect(appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          imageUrl: null,
        },
      }),
      expect.any(Function),
    );
  });
});
