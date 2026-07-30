import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { Readable, Writable } from 'node:stream';

import {
  DeleteProfileImageCommand,
  UploadProfileImageCommand,
} from './commands/profile-image.commands';
import type { ImageUploadFile } from './media.service';
import { ObjectController, ProfileImageController } from './profile-image.controller';

describe('ProfileImageController', () => {
  it('dispatches profile image uploads to the command bus', async () => {
    const file = {} as ImageUploadFile;
    const execute = jest.fn().mockResolvedValue({
      imageUrl:
        'http://localhost:3002/media/objects/profile-images/user_123/new.png',
    });
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute } as never,
    );

    await expect(
      controller.uploadProfileImage({} as never, file),
    ).resolves.toEqual({
      imageUrl:
        'http://localhost:3002/media/objects/profile-images/user_123/new.png',
    });

    expect(execute).toHaveBeenCalledWith(
      new UploadProfileImageCommand('user_123', file),
    );
  });

  it('dispatches profile image deletes to the command bus', async () => {
    const execute = jest.fn().mockResolvedValue({ imageUrl: null });
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute } as never,
    );

    await expect(controller.deleteProfileImage({} as never)).resolves.toEqual({
      imageUrl: null,
    });
    expect(execute).toHaveBeenCalledWith(
      new DeleteProfileImageCommand('user_123'),
    );
  });

  it('rejects unauthenticated uploads', async () => {
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: null }) } as never,
      { execute: jest.fn() } as never,
    );

    await expect(
      controller.uploadProfileImage({} as never, {} as ImageUploadFile),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('ObjectController', () => {
  it('does not expose collection objects without active asset metadata', async () => {
    const execute = jest.fn();
    const controller = new ObjectController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute } as never,
    );

    await expect(
      controller.getObject(
        { headers: {} } as never,
        responseDouble() as never,
        'documents/collection/original/file.pdf',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated object reads', async () => {
    const controller = new ObjectController(
      { create: jest.fn().mockResolvedValue({ userId: null }) } as never,
      { execute: jest.fn() } as never,
    );

    await expect(
      controller.getObject(
        { headers: {} } as never,
        responseDouble() as never,
        ['profile-images', 'user_123', 'avatar.png'],
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('streams authenticated object reads with cache headers through the query bus', async () => {
    const content = Readable.from(Buffer.from('image'));
    const response = responseDouble();
    const execute = jest.fn().mockResolvedValue({
      content,
      contentLength: 5,
      contentType: 'image/png',
      etag: '"etag-1"',
    });
    const controller = new ObjectController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute } as never,
    );

    await controller.getObject(
      { headers: {} } as never,
      response as never,
      ['profile-images', 'user_123', 'avatar.png'],
    );

    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(response.setHeader).toHaveBeenCalledWith('Content-Length', '5');
    expect(response.setHeader).toHaveBeenCalledWith('ETag', '"etag-1"');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, max-age=86400, immutable',
    );
    expect(response.written.toString()).toBe('image');
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        objectName: 'profile-images/user_123/avatar.png',
      }),
    );
  });

  it('returns 304 when the ETag matches', async () => {
    const response = responseDouble();
    const controller = new ObjectController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      {
        execute: jest.fn().mockResolvedValue({
          content: Readable.from(Buffer.from('image')),
          contentLength: 5,
          contentType: 'image/png',
          etag: '"etag-1"',
        }),
      } as never,
    );

    await controller.getObject(
      { headers: { 'if-none-match': '"etag-1"' } } as never,
      response as never,
      'profile-images/user_123/avatar.png',
    );

    expect(response.status).toHaveBeenCalledWith(304);
    expect(response.end).toHaveBeenCalled();
    expect(response.written.length).toBe(0);
  });
});

function responseDouble() {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  }) as Writable & {
    setHeader: jest.Mock;
    status: jest.Mock;
    end: jest.Mock;
    written: Buffer;
  };

  writable.setHeader = jest.fn();
  writable.status = jest.fn().mockReturnValue(writable);
  const realEnd = writable.end.bind(writable);
  writable.end = jest.fn((...args: Parameters<Writable['end']>) =>
    realEnd(...args),
  ) as Writable['end'] & jest.Mock;
  Object.defineProperty(writable, 'written', {
    get: () => Buffer.concat(chunks),
  });

  return writable;
}
