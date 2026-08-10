import { describe, expect, it, jest } from '@jest/globals';

import { DropLegacyPasswordResetDeliveryState1769800000000 } from './migrations/1769800000000-DropLegacyPasswordResetDeliveryState';

describe('DropLegacyPasswordResetDeliveryState1769800000000', () => {
  it('removes state that only supported forced reset delivery', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new DropLegacyPasswordResetDeliveryState1769800000000().up({
      query,
    } as never);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'DROP COLUMN IF EXISTS "passwordMigrationResetSentAt"',
      ),
    );
  });

  it('restores the nullable delivery timestamp when reverted', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new DropLegacyPasswordResetDeliveryState1769800000000().down({
      query,
    } as never);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ADD COLUMN IF NOT EXISTS "passwordMigrationResetSentAt" TIMESTAMP WITH TIME ZONE',
      ),
    );
  });
});
