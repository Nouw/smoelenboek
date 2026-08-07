import { Logger } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import type { UserEntity } from '../entities/user.entity';
import { SearchUsersHandler } from './search-users.handler';
import { SearchUsersQuery } from './search-users.query';

describe('SearchUsersHandler', () => {
  it('returns at most the repository search results as summaries', async () => {
    const debug = jest
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);
    const search = jest.fn().mockResolvedValue([
      {
        id: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        firstName: 'Fabio',
        lastName: 'Dijkshoorn',
        name: '',
        email: 'fabio@example.com',
        imageUrl: null,
      } as UserEntity,
    ]);
    const handler = new SearchUsersHandler({ search } as never);

    await expect(
      handler.execute(new SearchUsersQuery('fabio')),
    ).resolves.toEqual([
      {
        id: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        name: 'Fabio Dijkshoorn',
        email: 'fabio@example.com',
        imageUrl: null,
      },
    ]);
    expect(search).toHaveBeenCalledWith('fabio', 20);
    expect(debug).toHaveBeenCalledWith({
      event: 'users_searched',
      queryLength: 5,
      resultCount: 1,
    });
    debug.mockRestore();
  });
});
