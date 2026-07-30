import { describe, expect, it, jest } from '@jest/globals';

import {
  PublishProtototoRoundHandler,
  UpdateProtototoRoundHandler,
} from './protototo-round.handlers';
import {
  PublishProtototoRoundCommand,
  UpdateProtototoRoundCommand,
} from './protototo.commands';

const roundId = '11111111-1111-4111-8111-111111111111';
const actorId = '22222222-2222-4222-8222-222222222222';

describe('Protototo round handlers', () => {
  it('enforces the earliest match deadline on first publication', async () => {
    const repository = repo({ publishedAt: null });
    repository.findActiveMatches.mockResolvedValue([
      { startsAt: new Date('2026-10-10T16:00:00.000Z') },
    ]);
    const handler = new PublishProtototoRoundHandler(
      {} as never,
      {} as never,
      repository as never,
    );

    await expect(
      handler.execute(new PublishProtototoRoundCommand(actorId, roundId)),
    ).rejects.toThrow('deadline must not be later than the earliest match');
  });

  it('allows a published round to be reopened after its snapshotted match time', async () => {
    const repository = repo({
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      closesAt: new Date('2026-10-09T16:00:00.000Z'),
    });
    repository.findActiveMatches.mockResolvedValue([
      { startsAt: new Date('2026-10-10T16:00:00.000Z') },
    ]);
    const events = {
      appendAndProject: jest.fn().mockResolvedValue({ id: roundId }),
    };
    const handler = new UpdateProtototoRoundHandler(
      events as never,
      {} as never,
      repository as never,
    );

    await expect(
      handler.execute(
        new UpdateProtototoRoundCommand(
          actorId,
          roundId,
          'Reopened',
          new Date('2026-09-01T00:00:00.000Z'),
          new Date('2026-10-12T16:00:00.000Z'),
          null,
        ),
      ),
    ).resolves.toBeDefined();
    expect(repository.findOverlappingPublishedRound).toHaveBeenCalled();
    expect(events.appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          closesAt: '2026-10-12T16:00:00.000Z',
          publishedAt: '2026-09-01T00:00:00.000Z',
        }),
      }),
      expect.any(Function),
    );
  });

  it('prevents reopened published rounds from overlapping another round', async () => {
    const repository = repo({
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    });
    repository.findOverlappingPublishedRound.mockResolvedValue({
      id: 'other-round',
    });
    const handler = new UpdateProtototoRoundHandler(
      {} as never,
      {} as never,
      repository as never,
    );
    await expect(
      handler.execute(
        new UpdateProtototoRoundCommand(
          actorId,
          roundId,
          'Overlap',
          new Date('2026-10-01T00:00:00.000Z'),
          new Date('2026-10-03T00:00:00.000Z'),
          null,
        ),
      ),
    ).rejects.toThrow('may not overlap');
  });
});

function repo(overrides: Record<string, unknown> = {}) {
  const round = {
    id: roundId,
    title: 'October',
    opensAt: new Date('2026-10-01T00:00:00.000Z'),
    closesAt: new Date('2026-10-11T16:00:00.000Z'),
    tikkieUrl: null,
    publishedAt: null,
    archivedAt: null,
    ...overrides,
  };
  return {
    findRound: jest.fn().mockResolvedValue(round),
    findActiveMatches: jest.fn().mockResolvedValue([]),
    findOverlappingPublishedRound: jest.fn().mockResolvedValue(null),
  };
}
