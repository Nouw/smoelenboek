import { describe, expect, it, jest } from '@jest/globals';
import { IsNull, LessThanOrEqual } from 'typeorm';

import { CommitteesRepository } from './committees.repository';

describe('CommitteesRepository', () => {
  it('filters a committee roster by committee, season, and active membership', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const repository = new CommitteesRepository({} as never, { find } as never);

    await repository.findActiveMembershipsByCommitteeAndSeason(
      '521ccf21-351e-41bd-a06b-8da3af4599d4',
      2025,
      '2026-07-30',
    );

    expect(find).toHaveBeenCalledWith({
      where: {
        committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        seasonKey: 2025,
        startedOn: LessThanOrEqual('2026-07-30'),
        endedOn: IsNull(),
      },
    });
  });
});
