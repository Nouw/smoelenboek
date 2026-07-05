import { describe, expect, it } from '@jest/globals';

import { TeamEntity } from '../entities/team.entity';
import { TeamsRepository } from '../repositories/teams.repository';
import { ListTeamsHandler } from './team.handlers';

describe('ListTeamsHandler', () => {
  it('sorts teams by the number in the team name', async () => {
    const teamsRepository = {
      findAll: async () => [
        team('Heren 10'),
        team('Dames 11'),
        team('Heren 2'),
        team('Heren 1'),
        team('Dames 2'),
        team('Dames 1'),
      ],
    } as TeamsRepository;
    const handler = new ListTeamsHandler(teamsRepository);

    await expect(handler.execute()).resolves.toMatchObject([
      { name: 'Dames 1' },
      { name: 'Heren 1' },
      { name: 'Dames 2' },
      { name: 'Heren 2' },
      { name: 'Heren 10' },
      { name: 'Dames 11' },
    ]);
  });
});

function team(name: string): TeamEntity {
  const now = new Date('2026-07-05T00:00:00.000Z');

  return {
    id: `team-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    imageUrl: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  } as TeamEntity;
}
