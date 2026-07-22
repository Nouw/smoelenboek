import { describe, expect, it, jest } from '@jest/globals';

import { GetUserHandler } from './get-user.handler';
import { GetUserQuery } from './get-user.query';

describe('GetUserHandler', () => {
  it('looks up the requested user projection', async () => {
    const findById = jest.fn().mockResolvedValue(null);
    const handler = new GetUserHandler({ findById } as never);
    const userId = '6a0d03df-8c89-4309-b4ce-d1344f801b06';

    await expect(handler.execute(new GetUserQuery(userId))).resolves.toBeNull();
    expect(findById).toHaveBeenCalledWith(userId);
  });
});
