import { ConflictException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { TeamEntity } from '../entities/team.entity';
import {
  TeamArchivedEvent,
  TeamCreatedEvent,
  TeamRestoredEvent,
} from '../events/team-events';
import {
  ArchiveTeamCommand,
  CreateTeamCommand,
  RestoreTeamCommand,
} from './team.commands';
import {
  ArchiveTeamHandler,
  CreateTeamHandler,
  RestoreTeamHandler,
} from './team.handlers';

const actorUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const teamId = '521ccf21-351e-41bd-a06b-8da3af4599d4';

describe('team lifecycle handlers', () => {
  it('creates a categorized team with actor metadata', async () => {
    const entity = team();
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = new CreateTeamHandler(
      { appendAndPublish } as never,
      { findByNameCaseInsensitive: jest.fn().mockResolvedValue(null), findById: jest.fn().mockResolvedValue(entity) } as never,
    );

    await handler.execute(
      new CreateTeamCommand('Heren 1', 'men', actorUserId, null),
    );

    expect(appendAndPublish).toHaveBeenCalledWith(expect.any(TeamCreatedEvent));
    const [event] = (appendAndPublish as jest.MockedFunction<typeof appendAndPublish>).mock.calls[0] as [TeamCreatedEvent];
    expect(event.toRecord()).toMatchObject({
      eventVersion: 2,
      payload: expect.objectContaining({ category: 'men' }),
      metadata: { source: 'manual', actorUserId },
    });
  });

  it('rejects a case-insensitive duplicate name', async () => {
    const handler = new CreateTeamHandler(
      {} as never,
      {
        findByNameCaseInsensitive: jest.fn().mockResolvedValue(team()),
      } as never,
    );

    await expect(
      handler.execute(
        new CreateTeamCommand('heren 1', 'men', actorUserId, null),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('archives idempotently and restores with a distinct audit event', async () => {
    const archived = team({ archivedAt: new Date('2026-07-30T10:00:00.000Z') });
    const archiveAppend = jest.fn();
    const archiveHandler = new ArchiveTeamHandler(
      { appendAndPublish: archiveAppend } as never,
      { findById: jest.fn().mockResolvedValue(archived) } as never,
    );

    await expect(
      archiveHandler.execute(new ArchiveTeamCommand(teamId, actorUserId)),
    ).resolves.toMatchObject({ archivedAt: '2026-07-30T10:00:00.000Z' });
    expect(archiveAppend).not.toHaveBeenCalled();

    const restored = team({ archivedAt: null });
    const restoreAppend = jest.fn().mockResolvedValue({ dispatched: true });
    const restoreHandler = new RestoreTeamHandler(
      { appendAndPublish: restoreAppend } as never,
      { findById: jest.fn().mockResolvedValue(archived).mockResolvedValueOnce(archived).mockResolvedValueOnce(restored) } as never,
    );

    await restoreHandler.execute(new RestoreTeamCommand(teamId, actorUserId));

    expect(restoreAppend).toHaveBeenCalledWith(expect.any(TeamRestoredEvent));
    const [event] = (restoreAppend as jest.MockedFunction<typeof restoreAppend>).mock.calls[0] as [TeamRestoredEvent];
    expect(event.toRecord()).toMatchObject({
      eventType: 'team.restored',
      payload: expect.objectContaining({ archivedAt: null }),
      metadata: { source: 'manual', actorUserId },
    });
  });

  it('returns the archived team DTO on archive without publishing when already archived', async () => {
    const alreadyArchived = team({ archivedAt: new Date('2026-07-30T10:00:00.000Z') });
    const appendAndPublish = jest.fn();
    const handler = new ArchiveTeamHandler(
      { appendAndPublish } as never,
      { findById: jest.fn().mockResolvedValue(alreadyArchived) } as never,
    );

    const result = await handler.execute(new ArchiveTeamCommand(teamId, actorUserId));

    expect(appendAndPublish).not.toHaveBeenCalled();
    expect(result.archivedAt).toBe('2026-07-30T10:00:00.000Z');
  });

  it('archives a non-archived team', async () => {
    const entity = team({ archivedAt: null });
    const archivedEntity = team({ archivedAt: new Date('2026-07-30T10:00:00.000Z') });
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = new ArchiveTeamHandler(
      { appendAndPublish } as never,
      { findById: jest.fn().mockResolvedValue(entity).mockResolvedValueOnce(entity).mockResolvedValueOnce(archivedEntity) } as never,
    );

    await handler.execute(new ArchiveTeamCommand(teamId, actorUserId));

    expect(appendAndPublish).toHaveBeenCalledWith(expect.any(TeamArchivedEvent));
  });
});

function team(overrides: Partial<TeamEntity> = {}): TeamEntity {
  const now = new Date('2026-07-30T00:00:00.000Z');
  return Object.assign(new TeamEntity(), {
    id: teamId,
    name: 'Heren 1',
    category: 'men',
    imageUrl: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}
