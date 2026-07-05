import { describe, expect, it, jest } from '@jest/globals';

import { TeamMembershipEntity } from '../entities/team-membership.entity';
import { TeamEntity } from '../entities/team.entity';
import { TeamProjector } from './team-projector';

describe('TeamProjector', () => {
  it('projects a team snapshot with imageUrl', async () => {
    const entity = new TeamEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new TeamProjector();

    await expect(
      projector.projectTeamSnapshot(
        {
          teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
          name: 'Heren 1',
          imageUrl: 'https://cdn.example.com/team.png',
          archivedAt: null,
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Heren 1',
        imageUrl: 'https://cdn.example.com/team.png',
        archivedAt: null,
      }),
    );
  });

  it('projects a team membership assignment', async () => {
    const entity = new TeamMembershipEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new TeamProjector();

    await expect(
      projector.projectMemberAssigned(
        {
          membershipId: '02ac256b-ce8f-44e9-8913-7569c3401264',
          userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
          teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
          seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
          role: 'setter',
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        role: 'setter',
      }),
    );
  });
});
