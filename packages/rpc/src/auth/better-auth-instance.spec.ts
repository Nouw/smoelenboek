import { describe, expect, it } from '@jest/globals';

import { createBetterAuthPlugins } from './better-auth-instance';

describe('createBetterAuthPlugins', () => {
  it('installs the api key and admin plugins', () => {
    expect(
      createBetterAuthPlugins(
        () => 'api-key',
        () => 'admin',
      ),
    ).toEqual(['api-key', 'admin']);
  });
});
