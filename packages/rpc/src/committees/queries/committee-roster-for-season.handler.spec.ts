import { describe, expect, it } from '@jest/globals';

import type { CommitteesRepository } from '../repositories/committees.repository';
import type { UsersRepository } from '../../users/repositories/users.repository';
import { GetCommitteeRosterForSeasonHandler } from './committee.handlers';
import { GetCommitteeRosterForSeasonQuery } from './committee.queries';

const committeeId = '521ccf21-351e-41bd-a06b-8da3af4599d4';

describe('GetCommitteeRosterForSeasonHandler', () => {
  it('returns an enriched and sorted selected-season roster', async () => {
    const handler = new GetCommitteeRosterForSeasonHandler(
      {
        findById: async () => ({
          id: committeeId,
          name: 'Bestuur',
          imageUrl: 'https://example.com/banner.jpg',
          archivedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        findMembershipsByCommitteeAndSeason: async () => [
          membership('user-zoe'),
          membership('user-anna'),
          membership('missing-user'),
        ],
      } as unknown as CommitteesRepository,
      {
        findByIds: async () => [
          user('user-zoe', 'Zoë de Boer'),
          user('user-anna', 'Anna Jansen'),
        ],
      } as unknown as UsersRepository,
    );

    await expect(
      handler.execute(new GetCommitteeRosterForSeasonQuery(committeeId, 2024)),
    ).resolves.toMatchObject({
      committee: {
        imageUrl: 'https://example.com/banner.jpg',
      },
      season: { key: 2024, label: '2024/2025' },
      memberships: [
        { user: { id: 'user-anna', name: 'Anna Jansen' } },
        { user: { id: 'user-zoe', name: 'Zoë de Boer' } },
      ],
    });
  });

  it('returns null without loading memberships for an unknown committee', async () => {
    let membershipQueries = 0;
    const handler = new GetCommitteeRosterForSeasonHandler(
      {
        findById: async () => null,
        findMembershipsByCommitteeAndSeason: async () => {
          membershipQueries += 1;
          return [];
        },
      } as unknown as CommitteesRepository,
      { findByIds: async () => [] } as unknown as UsersRepository,
    );

    await expect(
      handler.execute(new GetCommitteeRosterForSeasonQuery(committeeId, 2024)),
    ).resolves.toBeNull();
    expect(membershipQueries).toBe(0);
  });
});

function membership(userId: string) {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: `membership-${userId}`,
    userId,
    committeeId,
    seasonKey: 2024,
    role: 'commissielid' as const,
    startedOn: '2024-08-01',
    endedOn: null,
    createdAt: now,
    updatedAt: now,
  };
}

function user(id: string, name: string) {
  return {
    id,
    name,
    firstName: null,
    lastName: null,
    email: `${id}@example.com`,
    imageUrl: null,
  };
}
