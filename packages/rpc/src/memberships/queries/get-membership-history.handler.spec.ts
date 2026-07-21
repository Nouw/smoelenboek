import { describe, expect, it, jest } from '@jest/globals';

import { GetMembershipHistoryHandler } from './get-membership-history.handler';
import { GetMembershipHistoryQuery } from './get-membership-history.query';

const now = new Date('2026-06-28T00:00:00.000Z');
const userId = 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0';

describe('GetMembershipHistoryHandler', () => {
  it('groups retained memberships by numeric season key, newest first', async () => {
    const endedTeamMembership = {
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      userId,
      teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      seasonKey: 2024,
      role: 'setter',
      startedOn: '2024-08-01',
      endedOn: '2025-01-12',
      createdAt: now,
      updatedAt: now,
    };
    const committeeMembership = {
      id: '58d05037-562f-45fa-8844-4c9741bbf2c8',
      userId,
      committeeId: '54475065-de41-465a-80c4-72b65986e432',
      seasonKey: 2025,
      role: 'secretaris',
      startedOn: '2025-08-01',
      endedOn: null,
      createdAt: now,
      updatedAt: now,
    };
    const handler = new GetMembershipHistoryHandler(
      {
        findMembershipsByUser: jest
          .fn()
          .mockResolvedValue([endedTeamMembership]),
      } as never,
      {
        findMembershipsByUser: jest
          .fn()
          .mockResolvedValue([committeeMembership]),
      } as never,
    );

    const result = await handler.execute(new GetMembershipHistoryQuery(userId));

    expect(result.seasons.map(({ seasonKey }) => seasonKey)).toEqual([
      2025, 2024,
    ]);
    expect(result.seasons[0]).toMatchObject({
      seasonKey: 2025,
      label: '2025/2026',
      startsOn: '2025-08-01',
      endsBefore: '2026-08-01',
    });
    expect(result.seasons[1]?.teamMemberships[0]).toMatchObject({
      seasonKey: 2024,
      endedOn: '2025-01-12',
    });
  });
});
