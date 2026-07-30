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
          category: 'men',
          imageUrl: 'https://cdn.example.com/team.png',
          archivedAt: null,
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Heren 1',
        category: 'men',
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
          seasonKey: 2025,
          role: 'setter',
          startedOn: '2025-08-01',
          endedOn: null,
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        seasonKey: 2025,
        startedOn: '2025-08-01',
        endedOn: null,
        role: 'setter',
      }),
    );
  });

  it('ends a membership without deleting its history', async () => {
    const entity = Object.assign(new TeamMembershipEntity(), {
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      seasonKey: 2025,
      startedOn: '2025-08-01',
      endedOn: null,
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      save: jest.fn().mockResolvedValue(entity),
      delete: jest.fn(),
    };
    const projector = new TeamProjector();

    await expect(
      projector.projectMemberRemoved(
        {
          membershipId: entity.id,
          removedOn: '2026-02-01',
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(entity.endedOn).toBe('2026-02-01');
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('caps a stale removal at the end of its season', async () => {
    const entity = Object.assign(new TeamMembershipEntity(), {
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      seasonKey: 2024,
      startedOn: '2024-08-01',
      endedOn: null,
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };

    await new TeamProjector().projectMemberRemoved(
      { membershipId: entity.id, removedOn: '2026-07-21' },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(entity.endedOn).toBe('2025-07-31');
  });
});
