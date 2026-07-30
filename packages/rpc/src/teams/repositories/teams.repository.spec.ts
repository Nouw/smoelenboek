import { describe, expect, it, jest } from '@jest/globals';
import { IsNull, LessThanOrEqual } from 'typeorm';

import { TeamsRepository } from './teams.repository';

describe('TeamsRepository', () => {
  it('filters a team roster by team, season, and active membership', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const repository = new TeamsRepository({} as never, { find } as never);

    await repository.findActiveMembershipsByTeamAndSeason(
      '521ccf21-351e-41bd-a06b-8da3af4599d4',
      2025,
      '2026-07-30',
    );

    expect(find).toHaveBeenCalledWith({
      where: {
        teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        seasonKey: 2025,
        startedOn: LessThanOrEqual('2026-07-30'),
        endedOn: IsNull(),
      },
    });
  });
});
