import { describe, expect, it, jest } from '@jest/globals';

import { ListManagedUsersHandler } from './admin-user.handlers';
import { ListManagedUsersQuery } from './admin-user.queries';

describe('ListManagedUsersHandler', () => {
  it('returns each managed user role for administrator controls', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id: '6a0d03df-8c89-4309-b4ce-d1344f801b06',
        email: 'admin@example.com',
        name: 'Example Admin',
        preferredLocale: 'nl',
        role: 'admin',
        invitedAt: new Date('2026-08-01T10:00:00.000Z'),
        accountActivatedAt: new Date('2026-08-02T10:00:00.000Z'),
        invitationStatus: 'active',
      },
    ]);
    const handler = new ListManagedUsersHandler({ query } as never);

    await expect(
      handler.execute(new ListManagedUsersQuery('', 50, 0)),
    ).resolves.toEqual([
      expect.objectContaining({
        role: 'admin',
        invitedAt: '2026-08-01T10:00:00.000Z',
        accountActivatedAt: '2026-08-02T10:00:00.000Z',
      }),
    ]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('u."role"'),
      ['', 50, 0],
    );
  });
});
