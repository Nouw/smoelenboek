import { describe, expect, it, jest } from '@jest/globals';
import { Readable } from 'node:stream';

import { GetObjectHandler } from './get-object.handler';
import { GetObjectQuery } from './get-object.query';

describe('GetObjectHandler', () => {
  it('loads an object by name through the media service', async () => {
    const object = {
      content: Readable.from(Buffer.from('object')),
      contentLength: 6,
      contentType: 'image/png',
      etag: '"etag-1"',
    };
    const getObjectByName = jest.fn().mockResolvedValue(object);
    const handler = new GetObjectHandler({ getObjectByName } as never);

    await expect(
      handler.execute(new GetObjectQuery('profile-images/user_123/avatar.png')),
    ).resolves.toBe(object);

    expect(getObjectByName).toHaveBeenCalledWith(
      'profile-images/user_123/avatar.png',
    );
  });
});
