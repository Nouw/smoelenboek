import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { CommitteeEntity } from '../entities/committee.entity';
import {
  CommitteeArchivedEvent,
  CommitteeCreatedEvent,
  CommitteeRestoredEvent,
  CommitteeUpdatedEvent,
} from '../events/committee-events';
import {
  ArchiveCommitteeCommand,
  CreateCommitteeCommand,
  RestoreCommitteeCommand,
  UpdateCommitteeCommand,
} from './committee.commands';
import {
  ArchiveCommitteeHandler,
  CreateCommitteeHandler,
  RestoreCommitteeHandler,
  UpdateCommitteeHandler,
} from './committee.handlers';

const now = new Date('2026-07-21T12:00:00.000Z');
const committeeId = '521ccf21-351e-41bd-a06b-8da3af4599d4';

function committee(overrides: Partial<CommitteeEntity> = {}): CommitteeEntity {
  return Object.assign(new CommitteeEntity(), {
    id: committeeId,
    name: 'Bestuur',
    imageUrl: null,
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
      const appendAndPublish = jest
        .fn()
        .mockResolvedValue({ dispatched: true });
      const handler = new CreateCommitteeHandler(
        { appendAndPublish } as never,
        {
          findByNameCaseInsensitive: jest.fn().mockResolvedValue(null),
          findById: jest.fn().mockResolvedValue(entity),
        } as never,
      );

      const result = await handler.execute(
        new CreateCommitteeCommand(
          'Bestuur',
          'admin-user',
          'https://example.com/banner.jpg',
        ),
      );

      expect(appendAndPublish).toHaveBeenCalledWith(
        expect.any(CommitteeCreatedEvent),
      );
      const [event] = (
        appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
      ).mock.calls[0] as [CommitteeCreatedEvent];
      expect(event.toRecord()).toMatchObject({
        eventType: 'committee.created',
        eventVersion: 2,
        payload: expect.objectContaining({
          name: 'Bestuur',
          imageUrl: 'https://example.com/banner.jpg',
          archivedAt: null,
        }),
        metadata: expect.objectContaining({ actorUserId: 'admin-user' }),
      });
      expect(result.id).toBe(committeeId);
    });

    it('rejects a duplicate committee name', async () => {
      const handler = new CreateCommitteeHandler(
        {} as never,
        {
          findByNameCaseInsensitive: jest.fn().mockResolvedValue(committee()),
        } as never,
      );

      await expect(
        handler.execute(new CreateCommitteeCommand('bestuur', 'admin-user')),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('UpdateCommitteeHandler', () => {
    it('throws NotFoundException when committee does not exist', async () => {
      const handler = new UpdateCommitteeHandler(
        {} as never,
        { findById: jest.fn().mockResolvedValue(null) } as never,
      );

      await expect(
        handler.execute(
          new UpdateCommitteeCommand('nonexistent', 'New Name', 'admin-user'),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('publishes CommitteeUpdatedEvent and returns re-read DTO', async () => {
      const entity = committee();
      const appendAndPublish = jest
        .fn()
        .mockResolvedValue({ dispatched: true });
      const findById = jest
        .fn()
        .mockResolvedValueOnce(entity)
        .mockResolvedValueOnce(
          Object.assign(committee(), { name: 'Bestuur 2' }),
        );
      const handler = new UpdateCommitteeHandler(
        { appendAndPublish } as never,
        {
          findById,
          findByNameCaseInsensitive: jest.fn().mockResolvedValue(null),
        } as never,
      );

      const result = await handler.execute(
        new UpdateCommitteeCommand(
          committeeId,
          'Bestuur 2',
          'admin-user',
          'https://example.com/banner-2.jpg',
        ),
      );

      expect(appendAndPublish).toHaveBeenCalledWith(
        expect.any(CommitteeUpdatedEvent),
      );
      expect((appendAndPublish as jest.Mock).mock.calls[0]?.[0]).toMatchObject({
        payload: { imageUrl: 'https://example.com/banner-2.jpg' },
        metadata: { actorUserId: 'admin-user' },
      });
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
        handler.execute(
          new ArchiveCommitteeCommand('nonexistent', 'admin-user'),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('publishes CommitteeArchivedEvent with timestamp and returns DTO', async () => {
      const entity = committee();
      const archived = committee({ archivedAt: now });
      const appendAndPublish = jest
        .fn()
        .mockResolvedValue({ dispatched: true });
      const findById = jest
        .fn()
        .mockResolvedValueOnce(entity)
        .mockResolvedValueOnce(archived);
      const handler = new ArchiveCommitteeHandler(
        { appendAndPublish } as never,
        { findById } as never,
      );

      const result = await handler.execute(
        new ArchiveCommitteeCommand(committeeId, 'admin-user'),
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

  describe('RestoreCommitteeHandler', () => {
    it('restores an archived committee and preserves its image', async () => {
      const archived = committee({
        archivedAt: now,
        imageUrl: 'https://example.com/banner.jpg',
      });
      const restored = committee({ imageUrl: archived.imageUrl });
      const appendAndPublish = jest
        .fn()
        .mockResolvedValue({ dispatched: true });
      const handler = new RestoreCommitteeHandler(
        { appendAndPublish } as never,
        {
          findById: jest
            .fn()
            .mockResolvedValueOnce(archived)
            .mockResolvedValueOnce(restored),
        } as never,
      );

      await expect(
        handler.execute(new RestoreCommitteeCommand(committeeId, 'admin-user')),
      ).resolves.toMatchObject({
        archivedAt: null,
        imageUrl: archived.imageUrl,
      });
      expect(appendAndPublish).toHaveBeenCalledWith(
        expect.any(CommitteeRestoredEvent),
      );
    });
  });
});
