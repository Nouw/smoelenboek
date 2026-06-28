import { describe, expect, it, jest } from '@jest/globals';

import { GenerateSeasonsCommand } from './generate-seasons.command';
import { GenerateSeasonsHandler } from './generate-seasons.handler';

const now = new Date('2026-06-28T00:00:00.000Z');

describe('GenerateSeasonsHandler', () => {
  it('is idempotent and appends events only for missing seasons', async () => {
    const existingSeason = {
      id: 'f254a0d5-7ce5-4c13-aaac-50e0831bf3ec',
      name: '2026/2027',
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2027-07-31T23:59:59.999Z'),
      createdAt: now,
      updatedAt: now,
    };
    const createdSeason = {
      id: '7f29164e-97bc-4759-8506-68d2a046516c',
      name: '2027/2028',
      startsAt: new Date('2027-08-01T00:00:00.000Z'),
      endsAt: new Date('2028-07-31T23:59:59.999Z'),
      createdAt: now,
      updatedAt: now,
    };
    const findByName = jest
      .fn()
      .mockResolvedValueOnce(existingSeason)
      .mockResolvedValueOnce(null);
    const appendAndProject = jest.fn(async (_event, projector) =>
      projector({ id: 'event_123' }, { manager: true }),
    );
    const projectSnapshot = jest.fn().mockResolvedValue(createdSeason);
    const handler = new GenerateSeasonsHandler(
      { appendAndProject } as never,
      { projectSnapshot } as never,
      { findByName } as never,
    );

    await expect(
      handler.execute(new GenerateSeasonsCommand(2026, 2027)),
    ).resolves.toEqual([
      {
        id: 'f254a0d5-7ce5-4c13-aaac-50e0831bf3ec',
        name: '2026/2027',
        startsAt: '2026-08-01T00:00:00.000Z',
        endsAt: '2027-07-31T23:59:59.999Z',
        createdAt: '2026-06-28T00:00:00.000Z',
        updatedAt: '2026-06-28T00:00:00.000Z',
      },
      {
        id: '7f29164e-97bc-4759-8506-68d2a046516c',
        name: '2027/2028',
        startsAt: '2027-08-01T00:00:00.000Z',
        endsAt: '2028-07-31T23:59:59.999Z',
        createdAt: '2026-06-28T00:00:00.000Z',
        updatedAt: '2026-06-28T00:00:00.000Z',
      },
    ]);

    expect(appendAndProject).toHaveBeenCalledTimes(1);
    expect(appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateType: 'season',
        eventType: 'season.generated',
        eventVersion: 1,
        payload: expect.objectContaining({
          name: '2027/2028',
          startsAt: '2027-08-01T00:00:00.000Z',
          endsAt: '2028-07-31T23:59:59.999Z',
        }),
        metadata: { source: 'season-generator' },
      }),
      expect.any(Function),
    );
    expect(projectSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '2027/2028',
      }),
      { manager: true },
    );
  });
});

