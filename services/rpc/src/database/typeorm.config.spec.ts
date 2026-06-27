import { describe, expect, it } from '@jest/globals';

import { getDatabaseUrl } from './typeorm.config';

describe('getDatabaseUrl', () => {
  it('returns DATABASE_URL when configured', () => {
    expect(
      getDatabaseUrl({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      } as NodeJS.ProcessEnv),
    ).toBe('postgresql://user:pass@localhost:5432/app');
  });

  it('rejects missing DATABASE_URL', () => {
    expect(() => getDatabaseUrl({} as NodeJS.ProcessEnv)).toThrow(
      'DATABASE_URL is required for services/rpc.',
    );
  });
});
