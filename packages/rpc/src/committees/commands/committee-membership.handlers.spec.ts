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

function membership(
  overrides: Partial<CommitteeMembershipEntity> = {},
): CommitteeMembershipEntity {
  return Object.assign(new CommitteeMembershipEntity(), {
    id: membershipId,
    userId,
    committeeId,
    seasonKey: 2023,
    role: 'voorzitter',
    startedOn: '2023-09-15',
    endedOn: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe('committee membership handlers', () => {
  describe('AssignCommitteeMemberHandler', () => {
    it('preserves an explicitly selected season and effective start date', async () => {
      const entity = membership();
      const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
      const handler = new AssignCommitteeMemberHandler(
        { appendAndPublish } as never,
        { findMembershipById: jest.fn().mockResolvedValue(entity) } as never,
      );

      await handler.execute(
        new AssignCommitteeMemberCommand(
          userId,
          committeeId,
          'voorzitter',
          2023,
          '2023-09-15',
        ),
      );

      expect(appendAndPublish).toHaveBeenCalledWith(
        expect.any(CommitteeMemberAssignedEvent),
      );
      const [event] = (
        appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
      ).mock.calls[0] as [CommitteeMemberAssignedEvent];
      expect(event.toRecord()).toMatchObject({
        eventVersion: 2,
        payload: expect.objectContaining({
          seasonKey: 2023,
          startedOn: '2023-09-15',
          endedOn: null,
        }),
      });
    });
  });

  describe('RemoveCommitteeMemberHandler', () => {
    it('publishes CommitteeMemberRemovedEvent and returns DTO from re-read', async () => {
      const entity = membership({ endedOn: '2026-02-01' });
      const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
      const handler = new RemoveCommitteeMemberHandler(
        { appendAndPublish } as never,
        { findMembershipById: jest.fn().mockResolvedValue(entity) } as never,
      );

      const result = await handler.execute(
        new RemoveCommitteeMemberCommand(membershipId),
      );

      expect(appendAndPublish).toHaveBeenCalledWith(
        expect.any(CommitteeMemberRemovedEvent),
      );
      const [event] = (
        appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
      ).mock.calls[0] as [CommitteeMemberRemovedEvent];
      expect(event.toRecord()).toMatchObject({
        eventVersion: 2,
        payload: { membershipId },
      });
      expect(result?.id).toBe(membershipId);
      expect(result?.endedOn).toBe('2026-02-01');
    });

    it('returns null when membership is not found after dispatch', async () => {
      const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
      const handler = new RemoveCommitteeMemberHandler(
        { appendAndPublish } as never,
        { findMembershipById: jest.fn().mockResolvedValue(null) } as never,
      );

      const result = await handler.execute(
        new RemoveCommitteeMemberCommand(membershipId),
      );

      expect(result).toBeNull();
    });
  });
});
