import { describe, expect, it, jest } from '@jest/globals';

import { GetCurrentUserHandler } from './get-current-user.handler';
import { GetCurrentUserQuery } from './get-current-user.query';

describe('GetCurrentUserHandler', () => {
  it('returns null when no user projection exists', async () => {
    const handler = new GetCurrentUserHandler({
      findByClerkUserId: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(
      handler.execute(new GetCurrentUserQuery('user_123')),
    ).resolves.toBeNull();
  });
});
