import { describe, expect, it, jest } from '@jest/globals';

import { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import { CommitteeProjector } from './committee-projector';

describe('CommitteeProjector', () => {
  it('projects a committee membership assignment', async () => {
    const entity = new CommitteeMembershipEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new CommitteeProjector();

    await expect(
      projector.projectMemberAssigned(
        {
          membershipId: '02ac256b-ce8f-44e9-8913-7569c3401264',
          userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
          committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
          seasonKey: 2025,
          role: 'voorzitter',
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
        role: 'voorzitter',
      }),
    );
  });

  it('ends a membership without deleting its history', async () => {
    const entity = Object.assign(new CommitteeMembershipEntity(), {
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
    const projector = new CommitteeProjector();

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
});
