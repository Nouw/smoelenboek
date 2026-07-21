import { describe, expect, it } from '@jest/globals';

import { GetCurrentSeasonHandler } from './get-current-season.handler';
import { GetCurrentSeasonQuery } from './get-current-season.query';

describe('GetCurrentSeasonHandler', () => {
  it('computes the season without stored season records', async () => {
    const handler = new GetCurrentSeasonHandler();

    await expect(
      handler.execute(
        new GetCurrentSeasonQuery(new Date('2026-06-28T00:00:00.000Z')),
      ),
    ).resolves.toEqual({
      key: 2025,
      label: '2025/2026',
      startsOn: '2025-08-01',
      endsBefore: '2026-08-01',
    });
  });
});
