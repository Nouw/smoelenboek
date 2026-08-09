import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import {
  CommitteeMemberAssignedEvent,
  CommitteeMemberRemovedEvent,
} from '../events/committee-events';
import {
  AssignCommitteeMemberCommand,
  RemoveCommitteeMemberCommand,
} from './committee.commands';
import {
  AssignCommitteeMemberHandler,
  RemoveCommitteeMemberHandler,
} from './committee.handlers';

const now = new Date('2026-07-21T12:00:00.000Z');
const membershipId = '02ac256b-ce8f-44e9-8913-7569c3401264';
const userId = 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0';
const committeeId = '521ccf21-351e-41bd-a06b-8da3af4599d4';

function membership(): CommitteeMembershipEntity {
  return Object.assign(new CommitteeMembershipEntity(), {
    id: membershipId,
    userId,
    committeeId,
    seasonKey: 2025,
    role: 'voorzitter',
    startedOn: '2025-09-15',
    endedOn: null,
    createdAt: now,
    updatedAt: now,
  });
}

function assignmentHandler(overrides: Record<string, unknown> = {}) {
  const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
  const repository = {
    findById: jest
      .fn()
      .mockResolvedValue({ id: committeeId, archivedAt: null }),
    findActiveAssignment: jest.fn().mockResolvedValue(null),
    findMembershipById: jest.fn().mockResolvedValue(membership()),
    ...overrides,
  };
  const usersRepository = {
    findById: jest.fn().mockResolvedValue({ id: userId }),
  };
  return {
    appendAndPublish,
    repository,
    usersRepository,
    handler: new AssignCommitteeMemberHandler(
      { appendAndPublish } as never,
      repository as never,
      usersRepository as never,
    ),
  };
}

describe('committee membership handlers', () => {
  it('assigns a member for an explicit season with actor metadata', async () => {
    const { handler, appendAndPublish } = assignmentHandler();

    await handler.execute(
      new AssignCommitteeMemberCommand(
        userId,
        committeeId,
        'voorzitter',
        2025,
        '2025-09-15',
        'admin-user',
      ),
    );

    expect(appendAndPublish).toHaveBeenCalledWith(
      expect.any(CommitteeMemberAssignedEvent),
    );
    expect((appendAndPublish as jest.Mock).mock.calls[0]?.[0]).toMatchObject({
      payload: {
        seasonKey: 2025,
        startedOn: '2025-09-15',
        endedOn: null,
      },
      metadata: { actorUserId: 'admin-user' },
    });
  });

  it('rejects missing, archived, duplicate, and invalid assignments', async () => {
    const command = new AssignCommitteeMemberCommand(
      userId,
      committeeId,
      'voorzitter',
      2025,
      '2025-09-15',
      'admin-user',
    );

    await expect(
      assignmentHandler({
        findById: jest.fn().mockResolvedValue(null),
      }).handler.execute(command),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      assignmentHandler({
        findById: jest
          .fn()
          .mockResolvedValue({ id: committeeId, archivedAt: now }),
      }).handler.execute(command),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      assignmentHandler({
        findActiveAssignment: jest.fn().mockResolvedValue(membership()),
      }).handler.execute(command),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      assignmentHandler().handler.execute(
        new AssignCommitteeMemberCommand(
          userId,
          committeeId,
          'voorzitter',
          2025,
          '2024-01-01',
          'admin-user',
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unknown user', async () => {
    const setup = assignmentHandler();
    setup.usersRepository.findById.mockResolvedValue(null);

    await expect(
      setup.handler.execute(
        new AssignCommitteeMemberCommand(
          userId,
          committeeId,
          'voorzitter',
          2025,
          '2025-09-15',
          'admin-user',
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes an existing membership immediately and returns its DTO', async () => {
    const entity = membership();
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = new RemoveCommitteeMemberHandler(
      { appendAndPublish } as never,
      { findMembershipById: jest.fn().mockResolvedValue(entity) } as never,
    );

    await expect(
      handler.execute(
        new RemoveCommitteeMemberCommand(membershipId, 'admin-user'),
      ),
    ).resolves.toMatchObject({ id: membershipId });
    expect(appendAndPublish).toHaveBeenCalledWith(
      expect.any(CommitteeMemberRemovedEvent),
    );
    expect((appendAndPublish as jest.Mock).mock.calls[0]?.[0]).toMatchObject({
      eventVersion: 3,
      payload: { membershipId },
      metadata: { actorUserId: 'admin-user' },
    });
  });

  it('rejects removal of an unknown membership', async () => {
    const handler = new RemoveCommitteeMemberHandler(
      {} as never,
      { findMembershipById: jest.fn().mockResolvedValue(null) } as never,
    );

    await expect(
      handler.execute(
        new RemoveCommitteeMemberCommand(membershipId, 'admin-user'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
