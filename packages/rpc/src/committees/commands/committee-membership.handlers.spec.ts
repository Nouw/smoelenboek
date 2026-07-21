import { describe, expect, it, jest } from '@jest/globals';

import { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import { AssignCommitteeMemberCommand } from './committee.commands';
import { AssignCommitteeMemberHandler } from './committee.handlers';

describe('AssignCommitteeMemberHandler', () => {
  it('preserves an explicitly selected season and effective start date', async () => {
    const appendAndProject = jest.fn().mockResolvedValue(
      Object.assign(new CommitteeMembershipEntity(), {
        id: '02ac256b-ce8f-44e9-8913-7569c3401264',
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        seasonKey: 2023,
        role: 'voorzitter',
        startedOn: '2023-09-15',
        endedOn: null,
        createdAt: new Date('2026-07-21T12:00:00.000Z'),
        updatedAt: new Date('2026-07-21T12:00:00.000Z'),
      }),
    );
    const handler = new AssignCommitteeMemberHandler(
      { appendAndProject } as never,
      {} as never,
    );

    await handler.execute(
      new AssignCommitteeMemberCommand(
        'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        '521ccf21-351e-41bd-a06b-8da3af4599d4',
        'voorzitter',
        2023,
        '2023-09-15',
      ),
    );

    expect(appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        eventVersion: 2,
        payload: expect.objectContaining({
          seasonKey: 2023,
          startedOn: '2023-09-15',
        }),
      }),
      expect.any(Function),
    );
  });
});
