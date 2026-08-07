import { describe, expect, it, jest } from '@jest/globals';

import { RemoveEndedTeamMemberships1768900000000 } from './migrations/1768900000000-RemoveEndedTeamMemberships';

describe('RemoveEndedTeamMemberships1768900000000', () => {
  it('deletes legacy ended team-membership projections', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new RemoveEndedTeamMemberships1768900000000().up({ query } as never);

    expect(query).toHaveBeenCalledWith(
      'DELETE FROM "team_memberships" WHERE "endedOn" IS NOT NULL',
    );
  });

  it('rejects rollback because deleted roster rows cannot be restored', async () => {
    await expect(
      new RemoveEndedTeamMemberships1768900000000().down(),
    ).rejects.toThrow('cannot be reverted');
  });
});
