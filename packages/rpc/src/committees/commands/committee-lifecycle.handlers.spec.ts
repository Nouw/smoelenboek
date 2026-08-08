import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { CommitteeEntity } from '../entities/committee.entity';
import {
  CommitteeArchivedEvent,
  CommitteeCreatedEvent,
  CommitteeUpdatedEvent,
} from '../events/committee-events';
import {
  ArchiveCommitteeCommand,
  CreateCommitteeCommand,
  UpdateCommitteeCommand,
} from './committee.commands';
import {
  ArchiveCommitteeHandler,
  CreateCommitteeHandler,
  UpdateCommitteeHandler,
} from './committee.handlers';

const now = new Date('2026-07-21T12:00:00.000Z');
const committeeId = '521ccf21-351e-41bd-a06b-8da3af4599d4';

function committee(overrides: Partial<CommitteeEntity> = {}): CommitteeEntity {
  return Object.assign(new CommitteeEntity(), {
    id: committeeId,
    name: 'Bestuur',
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe('committee lifecycle handlers', () => {
  describe('CreateCommitteeHandler', () => {
    it('publishes CommitteeCreatedEvent and returns projected DTO', async () => {
      const entity = committee();
      const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
      const handler = new CreateCommitteeHandler(
        { appendAndPublish } as never,
        { findById: jest.fn().mockResolvedValue(entity) } as never,
      );

      const result = await handler.execute(new CreateCommitteeCommand('Bestuur'));

      expect(appendAndPublish).toHaveBeenCalledWith(
        expect.any(CommitteeCreatedEvent),
      );
      const [event] = (
        appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
      ).mock.calls[0] as [CommitteeCreatedEvent];
      expect(event.toRecord()).toMatchObject({
        eventType: 'committee.created',
        eventVersion: 1,
        payload: expect.objectContaining({ name: 'Bestuur', archivedAt: null }),
      });
      expect(result.id).toBe(committeeId);
    });
  });

  describe('UpdateCommitteeHandler', () => {
    it('throws NotFoundException when committee does not exist', async () => {
      const handler = new UpdateCommitteeHandler(
        {} as never,
        { findById: jest.fn().mockResolvedValue(null) } as never,
      );

      await expect(
        handler.execute(new UpdateCommitteeCommand('nonexistent', 'New Name')),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('publishes CommitteeUpdatedEvent and returns re-read DTO', async () => {
      const entity = committee();
      const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
      const findById = jest
        .fn()
        .mockResolvedValueOnce(entity)
        .mockResolvedValueOnce(Object.assign(committee(), { name: 'Bestuur 2' }));
      const handler = new UpdateCommitteeHandler(
        { appendAndPublish } as never,
        { findById } as never,
      );

      const result = await handler.execute(
        new UpdateCommitteeCommand(committeeId, 'Bestuur 2'),
      );

      expect(appendAndPublish).toHaveBeenCalledWith(
        expect.any(CommitteeUpdatedEvent),
      );
      expect(result.name).toBe('Bestuur 2');
    });
  });

  describe('ArchiveCommitteeHandler', () => {
    it('throws NotFoundException when committee does not exist', async () => {
      const handler = new ArchiveCommitteeHandler(
        {} as never,
        { findById: jest.fn().mockResolvedValue(null) } as never,
      );

      await expect(
        handler.execute(new ArchiveCommitteeCommand('nonexistent')),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('publishes CommitteeArchivedEvent with timestamp and returns DTO', async () => {
      const entity = committee();
      const archived = committee({ archivedAt: now });
      const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
      const findById = jest
        .fn()
        .mockResolvedValueOnce(entity)
        .mockResolvedValueOnce(archived);
      const handler = new ArchiveCommitteeHandler(
        { appendAndPublish } as never,
        { findById } as never,
      );

      const result = await handler.execute(
        new ArchiveCommitteeCommand(committeeId),
      );

      expect(appendAndPublish).toHaveBeenCalledWith(
        expect.any(CommitteeArchivedEvent),
      );
      const [event] = (
        appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
      ).mock.calls[0] as [CommitteeArchivedEvent];
      expect(event.payload.archivedAt).not.toBeNull();
      expect(result.archivedAt).not.toBeNull();
    });
  });
});
