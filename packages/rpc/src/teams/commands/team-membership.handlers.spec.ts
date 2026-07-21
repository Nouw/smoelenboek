import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { TeamMembershipEntity } from '../entities/team-membership.entity';
import {
  AssignTeamMemberCommand,
  RemoveTeamMemberCommand,
} from './team.commands';
import {
  AssignTeamMemberHandler,
  RemoveTeamMemberHandler,
} from './team.handlers';

const now = new Date('2026-07-21T12:00:00.000Z');

describe('team membership handlers', () => {
  afterEach(() => jest.useRealTimers());

  it('defaults an assignment to the current Amsterdam season', async () => {
    jest.useFakeTimers().setSystemTime(now);
    const appendAndProject = jest
      .fn()
      .mockResolvedValue(
        membership({ seasonKey: 2025, startedOn: '2025-08-01' }),
      );
    const handler = new AssignTeamMemberHandler(
      { appendAndProject } as never,
      {} as never,
    );

    await handler.execute(
      new AssignTeamMemberCommand(
        'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        '521ccf21-351e-41bd-a06b-8da3af4599d4',
        'setter',
      ),
    );

    expect(appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        eventVersion: 2,
        payload: expect.objectContaining({
          seasonKey: 2025,
          startedOn: '2025-08-01',
          endedOn: null,
        }),
      }),
      expect.any(Function),
    );
  });

  it('records an Amsterdam-local end date', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-31T22:30:00.000Z'));
    const appendAndProject = jest
      .fn()
      .mockResolvedValue(membership({ endedOn: '2026-08-01' }));
    const handler = new RemoveTeamMemberHandler(
      { appendAndProject } as never,
      {} as never,
    );

    await handler.execute(
      new RemoveTeamMemberCommand('02ac256b-ce8f-44e9-8913-7569c3401264'),
    );

    expect(appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          membershipId: '02ac256b-ce8f-44e9-8913-7569c3401264',
          removedOn: '2026-08-01',
        },
      }),
      expect.any(Function),
    );
  });
});

function membership(
  overrides: Partial<TeamMembershipEntity> = {},
): TeamMembershipEntity {
  return Object.assign(new TeamMembershipEntity(), {
    id: '02ac256b-ce8f-44e9-8913-7569c3401264',
    userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
    teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
    seasonKey: 2025,
    role: 'setter',
    startedOn: '2025-08-01',
    endedOn: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}
