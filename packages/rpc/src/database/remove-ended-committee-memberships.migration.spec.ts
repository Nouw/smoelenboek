import { describe, expect, it, jest } from '@jest/globals';

import { RemoveEndedCommitteeMemberships1769600000000 } from './migrations/1769600000000-RemoveEndedCommitteeMemberships';

describe('RemoveEndedCommitteeMemberships1769600000000', () => {
  it('deletes legacy ended committee-membership projections', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new RemoveEndedCommitteeMemberships1769600000000().up({
      query,
    } as never);

    expect(query).toHaveBeenCalledWith(
      'DELETE FROM "committee_memberships" WHERE "endedOn" IS NOT NULL',
    );
  });

  it('rejects rollback because deleted roster rows cannot be restored', async () => {
    await expect(
      new RemoveEndedCommitteeMemberships1769600000000().down(),
    ).rejects.toThrow('cannot be reverted');
  });
});
