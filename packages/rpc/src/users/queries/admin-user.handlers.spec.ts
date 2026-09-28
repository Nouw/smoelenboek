import { describe, expect, it, jest } from '@jest/globals';

import { ListManagedUsersHandler } from './admin-user.handlers';
import { ListManagedUsersQuery } from './admin-user.queries';

describe('ListManagedUsersHandler', () => {
  it('filters inactive users and includes their leave date', async () => {
    const query = jest.fn().mockResolvedValue([{
      id: '6a0d03df-8c89-4309-b4ce-d1344f801b06',
      email: 'former@example.com', name: 'Former Member', preferredLocale: 'en',
      role: 'user', invitedAt: null, accountActivatedAt: null,
      invitationStatus: 'cancelled', leaveDate: new Date('2026-09-23T22:00:00.000Z'),
    }]);
    const handler = new ListManagedUsersHandler({ query } as never);

    await expect(handler.execute(new ListManagedUsersQuery('former', 25, 10, 'inactive')))
      .resolves.toEqual([expect.objectContaining({ leaveDate: '2026-09-24' })]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ui."leaveDate" IS NOT NULL'),
      ['former', 25, 10, 'inactive'],
    );
    expect(String(query.mock.calls[0]?.[0])).toContain('ui."leaveDate"::text AS "leaveDate"');
  });

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
        leaveDate: null,
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
      ['', 50, 0, 'active'],
    );
  });
});
