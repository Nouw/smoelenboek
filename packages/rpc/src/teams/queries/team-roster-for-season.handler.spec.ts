import { describe, expect, it } from '@jest/globals';

import type { UserEntity } from '../../users/entities/user.entity';
import type { TeamMembershipEntity } from '../entities/team-membership.entity';
import type { TeamEntity } from '../entities/team.entity';
import { GetTeamRosterForSeasonHandler } from './team.handlers';
import { GetTeamRosterForSeasonQuery } from './team.queries';

const teamId = '521ccf21-351e-41bd-a06b-8da3af4599d4';

describe('GetTeamRosterForSeasonHandler', () => {
  it('returns enriched active and ended memberships for any season', async () => {
    const now = new Date('2026-07-30T00:00:00.000Z');
    const memberships = [
      membership('active-membership', 'user-active', null),
      membership('ended-membership', 'user-ended', '2025-01-10'),
    ];
    const handler = new GetTeamRosterForSeasonHandler(
      {
        findById: async () =>
          ({
            id: teamId,
            name: 'Dames 1',
            category: 'women',
            imageUrl: null,
            archivedAt: null,
            createdAt: now,
            updatedAt: now,
          }) as TeamEntity,
        findMembershipsByTeamAndSeason: async () => memberships,
      } as never,
      {
        findByIds: async () => [
          user('user-active', 'Anna Active'),
          user('user-ended', 'Eva Ended'),
        ],
      } as never,
    );

    await expect(
      handler.execute(new GetTeamRosterForSeasonQuery(teamId, 2024)),
    ).resolves.toMatchObject({
      team: { category: 'women' },
      season: { key: 2024, label: '2024/2025' },
      memberships: [
        {
          id: 'active-membership',
          user: { name: 'Anna Active' },
          endedOn: null,
        },
        {
          id: 'ended-membership',
          user: { name: 'Eva Ended' },
          endedOn: '2025-01-10',
        },
      ],
    });
  });
});

function membership(id: string, userId: string, endedOn: string | null) {
  const now = new Date('2026-07-30T00:00:00.000Z');
  return {
    id,
    userId,
    teamId,
    seasonKey: 2024,
    role: 'setter',
    startedOn: '2024-08-01',
    endedOn,
    createdAt: now,
    updatedAt: now,
  } as TeamMembershipEntity;
}

function user(id: string, name: string): UserEntity {
  return {
    id,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1],
    name,
    email: `${id}@example.com`,
    imageUrl: null,
  } as UserEntity;
}
