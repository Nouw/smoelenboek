import { describe, expect, it, jest } from '@jest/globals';

import { AddCommitteeImageUrl1769500000000 } from './migrations/1769500000000-AddCommitteeImageUrl';

describe('AddCommitteeImageUrl1769500000000', () => {
  it('adds and drops the committee image URL column', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddCommitteeImageUrl1769500000000();

    await migration.up({ query } as never);
    await migration.down({ query } as never);

    expect(query).toHaveBeenNthCalledWith(
      1,
      'ALTER TABLE "committees" ADD "imageUrl" character varying',
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'ALTER TABLE "committees" DROP COLUMN "imageUrl"',
    );
  });
});
