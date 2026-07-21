import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { ListSeasonsHandler } from './list-seasons.handler';

describe('ListSeasonsHandler', () => {
  afterEach(() => jest.useRealTimers());

  it('merges membership years with the current and next season', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T12:00:00.000Z'));
    const handler = new ListSeasonsHandler(
      { findSeasonKeys: jest.fn().mockResolvedValue([2023, 2025]) } as never,
      { findSeasonKeys: jest.fn().mockResolvedValue([2024, 2025]) } as never,
    );

    await expect(handler.execute()).resolves.toEqual([
      expect.objectContaining({ key: 2026, label: '2026/2027' }),
      expect.objectContaining({ key: 2025, label: '2025/2026' }),
      expect.objectContaining({ key: 2024, label: '2024/2025' }),
      expect.objectContaining({ key: 2023, label: '2023/2024' }),
    ]);
  });
});
