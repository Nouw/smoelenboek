import { describe, expect, it } from '@jest/globals';

import type { UserEntity } from '../../users/entities/user.entity';
import type { UsersRepository } from '../../users/repositories/users.repository';
import type { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import type { CommitteeEntity } from '../entities/committee.entity';
import type { CommitteesRepository } from '../repositories/committees.repository';
import { GetCurrentCommitteeRosterHandler } from './committee.handlers';
import { GetCurrentCommitteeRosterQuery } from './committee.queries';

const committeeId = '521ccf21-351e-41bd-a06b-8da3af4599d4';

describe('GetCurrentCommitteeRosterHandler', () => {
  it('returns and sorts one batched current-season member list', async () => {
    const repositoryCalls: Array<[string, number, string]> = [];
    let requestedUserIds: string[] = [];
    const memberships = [
      membership('user-zoe', 'secretaris'),
      membership('user-anna', 'voorzitter'),
      membership('missing-user', 'commissielid'),
    ];
    const committeesRepository = {
      findById: async () => committee(),
      findActiveMembershipsByCommitteeAndSeason: async (
        requestedCommitteeId: string,
        seasonKey: number,
        activeOn: string,
      ) => {
        repositoryCalls.push([requestedCommitteeId, seasonKey, activeOn]);
        return memberships;
      },
    } as unknown as CommitteesRepository;
    const usersRepository = {
      findByIds: async (ids: string[]) => {
        requestedUserIds = ids;
        return [
          user('user-zoe', { firstName: 'Zoë', lastName: 'De Boer' }),
          user('user-anna', { name: 'Anna Alternate' }),
        ];
      },
    } as unknown as UsersRepository;
    const handler = new GetCurrentCommitteeRosterHandler(
      committeesRepository,
      usersRepository,
    );

    const result = await handler.execute(
      new GetCurrentCommitteeRosterQuery(
        committeeId,
        new Date('2026-07-30T12:00:00.000Z'),
      ),
    );

    expect(repositoryCalls).toEqual([[committeeId, 2025, '2026-07-30']]);
    expect(requestedUserIds).toEqual([
      'user-zoe',
      'user-anna',
      'missing-user',
    ]);
    expect(result).toMatchObject({
      committee: { id: committeeId, name: 'Technische commissie' },
      season: { key: 2025, label: '2025/2026' },
      members: [
        { userId: 'user-anna', name: 'Anna Alternate', role: 'voorzitter' },
        { userId: 'user-zoe', name: 'Zoë De Boer', role: 'secretaris' },
      ],
    });
  });

  it('switches seasons at the Amsterdam August boundary', async () => {
    const seasonKeys: number[] = [];
    const activeDates: string[] = [];
    const handler = new GetCurrentCommitteeRosterHandler(
      {
        findById: async () => committee(),
        findActiveMembershipsByCommitteeAndSeason: async (
          _requestedCommitteeId: string,
          seasonKey: number,
          activeOn: string,
        ) => {
          seasonKeys.push(seasonKey);
          activeDates.push(activeOn);
          return [];
        },
      } as unknown as CommitteesRepository,
      { findByIds: async () => [] } as unknown as UsersRepository,
    );

    await handler.execute(
      new GetCurrentCommitteeRosterQuery(
        committeeId,
        new Date('2026-07-31T21:59:59.000Z'),
      ),
    );
    await handler.execute(
      new GetCurrentCommitteeRosterQuery(
        committeeId,
        new Date('2026-07-31T22:00:00.000Z'),
      ),
    );

    expect(seasonKeys).toEqual([2025, 2026]);
    expect(activeDates).toEqual(['2026-07-31', '2026-08-01']);
  });

  it('returns null without loading members for an unknown committee', async () => {
    let membershipQueries = 0;
    let userQueries = 0;
    const handler = new GetCurrentCommitteeRosterHandler(
      {
        findById: async () => null,
        findActiveMembershipsByCommitteeAndSeason: async () => {
          membershipQueries += 1;
          return [];
        },
      } as unknown as CommitteesRepository,
      {
        findByIds: async () => {
          userQueries += 1;
          return [];
        },
      } as unknown as UsersRepository,
    );

    await expect(
      handler.execute(
        new GetCurrentCommitteeRosterQuery(committeeId, new Date()),
      ),
    ).resolves.toBeNull();
    expect(membershipQueries).toBe(0);
    expect(userQueries).toBe(0);
  });
});

function committee(): CommitteeEntity {
  const now = new Date('2026-07-30T00:00:00.000Z');

  return {
    id: committeeId,
    name: 'Technische commissie',
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  } as CommitteeEntity;
}

function membership(
  userId: string,
  role: CommitteeMembershipEntity['role'],
): CommitteeMembershipEntity {
  return {
    userId,
    committeeId,
    seasonKey: 2025,
    role,
  } as CommitteeMembershipEntity;
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
