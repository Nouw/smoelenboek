import { describe, expect, it, jest } from '@jest/globals';

import { MigrateMediaImagesToObjects1767700000000 } from './migrations/1767700000000-MigrateMediaImagesToObjects';

describe('MigrateMediaImagesToObjects1767700000000', () => {
  it('rewrites user and team image URLs to the object route', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new MigrateMediaImagesToObjects1767700000000();

    await migration.up({ query } as never);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        `replace("imageUrl", '/media/images/', '/media/objects/')`,
      ),
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        `replace("imageUrl", '/media/images/', '/media/objects/')`,
      ),
    );
  });

  it('reverts object route URLs back to the legacy image route', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new MigrateMediaImagesToObjects1767700000000();

    await migration.down({ query } as never);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        `replace("imageUrl", '/media/objects/', '/media/images/')`,
      ),
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        `replace("imageUrl", '/media/objects/', '/media/images/')`,
      ),
    );
  });
});
