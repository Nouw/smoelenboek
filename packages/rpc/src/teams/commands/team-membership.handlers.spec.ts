import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { TeamMembershipEntity } from '../entities/team-membership.entity';
import {
  TeamMemberAssignedEvent,
  TeamMemberRemovedEvent,
} from '../events/team-events';
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
    const membershipEntity = membership({ seasonKey: 2025, startedOn: '2026-01-10' });
    const appendAndPublish = jest
      .fn()
      .mockResolvedValue({ dispatched: true });
    const handler = assignHandler({ appendAndPublish }, {}, null, membershipEntity);

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

    expect(appendAndPublish).toHaveBeenCalledWith(expect.any(TeamMemberAssignedEvent));
    const [event] = (appendAndPublish as jest.MockedFunction<typeof appendAndPublish>).mock.calls[0] as [TeamMemberAssignedEvent];
    expect(event.toRecord()).toMatchObject({
      metadata: { source: 'manual', actorUserId },
      payload: expect.objectContaining({
        seasonKey: 2025,
        startedOn: '2026-01-10',
        endedOn: null,
      }),
    });
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

  it('removes a membership and returns DTO from the pre-delete snapshot', async () => {
    const entity = membership();
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = new RemoveTeamMemberHandler(
      { appendAndPublish } as never,
      { findMembershipById: jest.fn().mockResolvedValue(entity) } as never,
    );

    const result = await handler.execute(new RemoveTeamMemberCommand(membershipId, actorUserId));

    expect(appendAndPublish).toHaveBeenCalledWith(expect.any(TeamMemberRemovedEvent));
    const [event] = (appendAndPublish as jest.MockedFunction<typeof appendAndPublish>).mock.calls[0] as [TeamMemberRemovedEvent];
    expect(event.toRecord()).toMatchObject({
      metadata: { source: 'manual', actorUserId },
      eventVersion: 3,
      payload: { membershipId },
    });
    expect(result.id).toBe(membershipId);
  });

  it('rejects removal of an unknown membership', async () => {
    const handler = new RemoveTeamMemberHandler(
      {} as never,
      {
        findMembershipById: jest.fn().mockResolvedValue(null),
      } as never,
    );

    await expect(
      handler.execute(new RemoveTeamMemberCommand(membershipId, actorUserId)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function assignHandler(
  eventStore: { appendAndPublish?: jest.Mock } = {},
  teamOverrides: { archivedAt?: Date | null } = {},
  duplicate: TeamMembershipEntity | null = null,
  membershipEntity: TeamMembershipEntity | null = null,
) {
  return new AssignTeamMemberHandler(
    {
      appendAndPublish: eventStore.appendAndPublish ?? jest.fn(),
    } as never,
    {
      findById: jest.fn().mockResolvedValue({
        id: teamId,
        archivedAt: null,
        ...teamOverrides,
      }),
      findActiveAssignment: jest.fn().mockResolvedValue(duplicate),
      findMembershipById: jest.fn().mockResolvedValue(membershipEntity),
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
