import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { TeamMembershipEntity } from '../entities/team-membership.entity';
import {
  AssignTeamMemberCommand,
  RemoveTeamMemberCommand,
} from './team.commands';
import {
  AssignTeamMemberHandler,
  RemoveTeamMemberHandler,
} from './team.handlers';

const actorUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userId = 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0';
const teamId = '521ccf21-351e-41bd-a06b-8da3af4599d4';
const membershipId = '02ac256b-ce8f-44e9-8913-7569c3401264';
const now = new Date('2026-07-21T12:00:00.000Z');

describe('team membership handlers', () => {
  it('validates dependencies and records actor metadata on assignment', async () => {
    const appendAndProject = jest
      .fn()
      .mockResolvedValue(
        membership({ seasonKey: 2025, startedOn: '2026-01-10' }),
      );
    const handler = assignHandler({ appendAndProject });

    await handler.execute(
      new AssignTeamMemberCommand(
        userId,
        teamId,
        'setter',
        2025,
        '2026-01-10',
        actorUserId,
      ),
    );

    expect(appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { source: 'manual', actorUserId },
        payload: expect.objectContaining({
          seasonKey: 2025,
          startedOn: '2026-01-10',
          endedOn: null,
        }),
      }),
      expect.any(Function),
    );
  });

  it('rejects assignment to an archived team', async () => {
    const handler = assignHandler({}, { archivedAt: now });

    await expect(
      handler.execute(
        new AssignTeamMemberCommand(
          userId,
          teamId,
          'setter',
          2025,
          '2025-08-01',
          actorUserId,
        ),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an identical active assignment', async () => {
    const handler = assignHandler({}, {}, membership());

    await expect(
      handler.execute(
        new AssignTeamMemberCommand(
          userId,
          teamId,
          'setter',
          2025,
          '2025-08-01',
          actorUserId,
        ),
      ),
    ).rejects.toThrow('already has this active team role');
  });

  it('ends a membership on the explicit valid date without deleting it', async () => {
    const entity = membership();
    const appendAndProject = jest
      .fn()
      .mockResolvedValue(membership({ endedOn: '2026-02-01' }));
    const handler = new RemoveTeamMemberHandler(
      { appendAndProject } as never,
      {} as never,
      { findMembershipById: jest.fn().mockResolvedValue(entity) } as never,
    );

    await handler.execute(
      new RemoveTeamMemberCommand(membershipId, '2026-02-01', actorUserId),
    );

    expect(appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { source: 'manual', actorUserId },
        payload: { membershipId, removedOn: '2026-02-01' },
      }),
      expect.any(Function),
    );
  });

  it('rejects an end date outside the membership season', async () => {
    const handler = new RemoveTeamMemberHandler(
      {} as never,
      {} as never,
      {
        findMembershipById: jest.fn().mockResolvedValue(membership()),
      } as never,
    );

    await expect(
      handler.execute(
        new RemoveTeamMemberCommand(membershipId, '2026-08-01', actorUserId),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns an already ended membership without appending another event', async () => {
    const entity = membership({ endedOn: '2026-02-01' });
    const appendAndProject = jest.fn();
    const handler = new RemoveTeamMemberHandler(
      { appendAndProject } as never,
      {} as never,
      { findMembershipById: jest.fn().mockResolvedValue(entity) } as never,
    );

    await expect(
      handler.execute(
        new RemoveTeamMemberCommand(membershipId, '2026-03-01', actorUserId),
      ),
    ).resolves.toMatchObject({ endedOn: '2026-02-01' });
    expect(appendAndProject).not.toHaveBeenCalled();
  });
});

function assignHandler(
  eventStore: { appendAndProject?: jest.Mock } = {},
  teamOverrides: { archivedAt?: Date | null } = {},
  duplicate: TeamMembershipEntity | null = null,
) {
  return new AssignTeamMemberHandler(
    {
      appendAndProject: eventStore.appendAndProject ?? jest.fn(),
    } as never,
    {} as never,
    {
      findById: jest.fn().mockResolvedValue({
        id: teamId,
        archivedAt: null,
        ...teamOverrides,
      }),
      findActiveAssignment: jest.fn().mockResolvedValue(duplicate),
    } as never,
    { findById: jest.fn().mockResolvedValue({ id: userId }) } as never,
  );
}

function membership(
  overrides: Partial<TeamMembershipEntity> = {},
): TeamMembershipEntity {
  return Object.assign(new TeamMembershipEntity(), {
    id: membershipId,
    userId,
    teamId,
    seasonKey: 2025,
    role: 'setter',
    startedOn: '2025-08-01',
    endedOn: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}
