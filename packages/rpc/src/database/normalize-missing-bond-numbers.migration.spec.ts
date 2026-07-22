import { describe, expect, it, jest } from '@jest/globals';

import { NormalizeMissingBondNumbers1768200000000 } from './migrations/1768200000000-NormalizeMissingBondNumbers';

describe('NormalizeMissingBondNumbers1768200000000', () => {
  it('converts the legacy dash placeholder to null', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new NormalizeMissingBondNumbers1768200000000();

    await migration.up({ query } as never);

    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(
        /UPDATE "user_information"[\s\S]*"bondNumber" = NULL[\s\S]*btrim\("bondNumber"\) = '-'/,
      ),
    );
  });

  it('does not invent a value when reverted', async () => {
    await expect(
      new NormalizeMissingBondNumbers1768200000000().down(),
    ).resolves.toBeUndefined();
  });
});
