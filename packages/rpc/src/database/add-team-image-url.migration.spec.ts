import { describe, expect, it, jest } from '@jest/globals';

import { AddTeamImageUrl1767600000000 } from './migrations/1767600000000-AddTeamImageUrl';

describe('AddTeamImageUrl1767600000000', () => {
  it('adds and drops the teams imageUrl column', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddTeamImageUrl1767600000000();

    await migration.up({ query } as never);
    await migration.down({ query } as never);

    expect(query).toHaveBeenNthCalledWith(
      1,
      'ALTER TABLE "teams" ADD "imageUrl" character varying',
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'ALTER TABLE "teams" DROP COLUMN "imageUrl"',
    );
  });
});
