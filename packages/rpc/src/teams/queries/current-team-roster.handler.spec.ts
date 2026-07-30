import { describe, expect, it } from '@jest/globals';

import type { UserEntity } from '../../users/entities/user.entity';
import type { UsersRepository } from '../../users/repositories/users.repository';
import type { TeamMembershipEntity } from '../entities/team-membership.entity';
import type { TeamEntity } from '../entities/team.entity';
import type { TeamsRepository } from '../repositories/teams.repository';
import { GetCurrentTeamRosterHandler } from './team.handlers';
import { GetCurrentTeamRosterQuery } from './team.queries';

const teamId = '521ccf21-351e-41bd-a06b-8da3af4599d4';

describe('GetCurrentTeamRosterHandler', () => {
  it('returns, groups, and sorts one batched current-season roster', async () => {
    const repositoryCalls: Array<[string, number, string]> = [];
    let requestedUserIds: string[] = [];
    const memberships = [
      membership('user-zoe', 'setter'),
      membership('user-coach', 'coach_trainer'),
      membership('user-anna', 'libero'),
      membership('missing-user', 'middle'),
    ];
    const teamsRepository = {
      findById: async () => team(),
      findActiveMembershipsByTeamAndSeason: async (
        requestedTeamId: string,
        seasonKey: number,
        activeOn: string,
      ) => {
        repositoryCalls.push([requestedTeamId, seasonKey, activeOn]);
        return memberships;
      },
    } as unknown as TeamsRepository;
    const usersRepository = {
      findByIds: async (ids: string[]) => {
        requestedUserIds = ids;
        return [
          user('user-zoe', { firstName: 'Zoë', lastName: 'De Boer' }),
          user('user-anna', { name: 'Anna Alternate' }),
          user('user-coach', { firstName: 'Bram', lastName: 'Coach' }),
        ];
      },
    } as unknown as UsersRepository;
    const handler = new GetCurrentTeamRosterHandler(
      teamsRepository,
      usersRepository,
    );

    const result = await handler.execute(
      new GetCurrentTeamRosterQuery(
        teamId,
        new Date('2026-07-30T12:00:00.000Z'),
      ),
    );

    expect(repositoryCalls).toEqual([[teamId, 2025, '2026-07-30']]);
    expect(requestedUserIds).toEqual([
      'user-zoe',
      'user-coach',
      'user-anna',
      'missing-user',
    ]);
    expect(result).toMatchObject({
      season: { key: 2025, label: '2025/2026' },
      coaches: [{ userId: 'user-coach', name: 'Bram Coach' }],
      players: [
        { userId: 'user-anna', name: 'Anna Alternate', role: 'libero' },
        { userId: 'user-zoe', name: 'Zoë De Boer', role: 'setter' },
      ],
    });
  });

  it('switches seasons at the Amsterdam August boundary', async () => {
    const seasonKeys: number[] = [];
    const activeDates: string[] = [];
    const handler = new GetCurrentTeamRosterHandler(
      {
        findById: async () => team(),
        findActiveMembershipsByTeamAndSeason: async (
          _requestedTeamId: string,
          seasonKey: number,
          activeOn: string,
        ) => {
          seasonKeys.push(seasonKey);
          activeDates.push(activeOn);
          return [];
        },
      } as unknown as TeamsRepository,
      { findByIds: async () => [] } as unknown as UsersRepository,
    );

    await handler.execute(
      new GetCurrentTeamRosterQuery(
        teamId,
        new Date('2026-07-31T21:59:59.000Z'),
      ),
    );
    await handler.execute(
      new GetCurrentTeamRosterQuery(
        teamId,
        new Date('2026-07-31T22:00:00.000Z'),
      ),
    );

    expect(seasonKeys).toEqual([2025, 2026]);
    expect(activeDates).toEqual(['2026-07-31', '2026-08-01']);
  });

  it('returns null without loading memberships or users for an unknown team', async () => {
    let membershipQueries = 0;
    let userQueries = 0;
    const handler = new GetCurrentTeamRosterHandler(
      {
        findById: async () => null,
        findActiveMembershipsByTeamAndSeason: async () => {
          membershipQueries += 1;
          return [];
        },
      } as unknown as TeamsRepository,
      {
        findByIds: async () => {
          userQueries += 1;
          return [];
        },
      } as unknown as UsersRepository,
    );

    await expect(
      handler.execute(new GetCurrentTeamRosterQuery(teamId, new Date())),
    ).resolves.toBeNull();
    expect(membershipQueries).toBe(0);
    expect(userQueries).toBe(0);
  });
});

function team(): TeamEntity {
  const now = new Date('2026-07-30T00:00:00.000Z');

  return {
    id: teamId,
    name: 'Heren 1',
    imageUrl: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  } as TeamEntity;
}

function membership(userId: string, role: TeamMembershipEntity['role']) {
  return { userId, teamId, seasonKey: 2025, role } as TeamMembershipEntity;
}

function user(
  id: string,
  overrides: Partial<Pick<UserEntity, 'name' | 'firstName' | 'lastName'>>,
): UserEntity {
  return {
    id,
    name: '',
    firstName: null,
    lastName: null,
    email: `${id}@example.com`,
    imageUrl: null,
    ...overrides,
  } as UserEntity;
}
