import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { SponsorhengelController } from './sponsorhengel.controller';

describe('SponsorhengelController', () => {
  it('allows a member with a legacy credential to request protected content', async () => {
    const controller = new SponsorhengelController(
      {
        create: jest.fn().mockResolvedValue({
          userId: 'member-1',
          role: 'user',
          passwordMigrationRequired: true,
        }),
      } as never,
      { getObjectByName: jest.fn() } as never,
      { find: jest.fn().mockResolvedValue(null) } as never,
    );

    await expect(
      controller.content(
        { headers: {} } as never,
        { setHeader: jest.fn() } as never,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
