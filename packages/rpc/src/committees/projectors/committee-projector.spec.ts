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
          seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
          role: 'voorzitter',
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        role: 'voorzitter',
      }),
    );
  });
});

