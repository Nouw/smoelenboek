import { describe, expect, it, jest } from '@jest/globals';

import { GetCurrentSeasonHandler } from './get-current-season.handler';
import { GetCurrentSeasonQuery } from './get-current-season.query';

describe('GetCurrentSeasonHandler', () => {
  it('returns null when no season contains the date', async () => {
    const handler = new GetCurrentSeasonHandler({
      findCurrent: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(
      handler.execute(new GetCurrentSeasonQuery(new Date('2026-06-28T00:00:00.000Z'))),
    ).resolves.toBeNull();
  });
});

