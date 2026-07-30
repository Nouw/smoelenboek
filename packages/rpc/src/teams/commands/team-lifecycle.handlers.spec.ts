import { ConflictException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { TeamEntity } from '../entities/team.entity';
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
    const appendAndProject = jest.fn().mockResolvedValue(entity);
    const handler = new CreateTeamHandler(
      { appendAndProject } as never,
      {} as never,
      { findByNameCaseInsensitive: jest.fn().mockResolvedValue(null) } as never,
    );

    await handler.execute(
      new CreateTeamCommand('Heren 1', 'men', actorUserId, null),
    );

    expect(appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        eventVersion: 2,
        payload: expect.objectContaining({ category: 'men' }),
        metadata: { source: 'manual', actorUserId },
      }),
      expect.any(Function),
    );
  });

  it('rejects a case-insensitive duplicate name', async () => {
    const handler = new CreateTeamHandler(
      {} as never,
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
      { appendAndProject: archiveAppend } as never,
      {} as never,
      { findById: jest.fn().mockResolvedValue(archived) } as never,
    );

    await expect(
      archiveHandler.execute(new ArchiveTeamCommand(teamId, actorUserId)),
    ).resolves.toMatchObject({ archivedAt: '2026-07-30T10:00:00.000Z' });
    expect(archiveAppend).not.toHaveBeenCalled();

    const restored = team({ archivedAt: null });
    const restoreAppend = jest.fn().mockResolvedValue(restored);
    const restoreHandler = new RestoreTeamHandler(
      { appendAndProject: restoreAppend } as never,
      {} as never,
      { findById: jest.fn().mockResolvedValue(archived) } as never,
    );

    await restoreHandler.execute(new RestoreTeamCommand(teamId, actorUserId));

    expect(restoreAppend).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'team.restored',
        payload: expect.objectContaining({ archivedAt: null }),
        metadata: { source: 'manual', actorUserId },
      }),
      expect.any(Function),
    );
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
