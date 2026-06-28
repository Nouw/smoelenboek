import { describe, expect, it, jest } from '@jest/globals';

import { GetMembershipHistoryHandler } from './get-membership-history.handler';
import { GetMembershipHistoryQuery } from './get-membership-history.query';

const now = new Date('2026-06-28T00:00:00.000Z');

describe('GetMembershipHistoryHandler', () => {
  it('groups team and committee memberships by season', async () => {
    const handler = new GetMembershipHistoryHandler(
      {
        findMembershipsByUser: jest.fn().mockResolvedValue([
          {
            id: '02ac256b-ce8f-44e9-8913-7569c3401264',
            userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
            teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
            seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
            role: 'setter',
            createdAt: now,
            updatedAt: now,
          },
        ]),
      } as never,
      {
        findMembershipsByUser: jest.fn().mockResolvedValue([
          {
            id: '58d05037-562f-45fa-8844-4c9741bbf2c8',
            userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
            committeeId: '54475065-de41-465a-80c4-72b65986e432',
            seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
            role: 'secretaris',
            createdAt: now,
            updatedAt: now,
          },
        ]),
      } as never,
    );

    await expect(
      handler.execute(
        new GetMembershipHistoryQuery(
          'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        ),
      ),
    ).resolves.toEqual({
      userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
      seasonCount: 1,
      seasons: [
        {
          seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
          teamMemberships: [
            {
              id: '02ac256b-ce8f-44e9-8913-7569c3401264',
              userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
              teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
              seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
              role: 'setter',
              createdAt: '2026-06-28T00:00:00.000Z',
              updatedAt: '2026-06-28T00:00:00.000Z',
            },
          ],
          committeeMemberships: [
            {
              id: '58d05037-562f-45fa-8844-4c9741bbf2c8',
              userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
              committeeId: '54475065-de41-465a-80c4-72b65986e432',
              seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
              role: 'secretaris',
              createdAt: '2026-06-28T00:00:00.000Z',
              updatedAt: '2026-06-28T00:00:00.000Z',
            },
          ],
        },
      ],
    });
  });
});

