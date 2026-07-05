import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { Readable, Writable } from 'node:stream';

import { UpdateUserProfileCommand } from '../users/commands/update-user-profile.command';
import type { ImageUploadFile } from './media.service';
import { ImageController, ProfileImageController } from './profile-image.controller';

describe('ProfileImageController', () => {
  it('uploads a profile image, updates the user, and deletes the previous image', async () => {
    const execute = jest.fn().mockResolvedValue({});
    const deleteImageByUrl = jest.fn().mockResolvedValue(undefined);
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute } as never,
      {
        uploadImage: jest.fn().mockResolvedValue({
          imageUrl:
            'http://localhost:3002/media/images/profile-images/user_123/new.png',
        }),
        deleteImageByUrl,
      } as never,
      {
        findById: jest.fn().mockResolvedValue({
          imageUrl:
            'http://localhost:3002/media/images/profile-images/user_123/old.png',
        }),
      } as never,
    );

    await expect(
      controller.uploadProfileImage({} as never, {} as ImageUploadFile),
    ).resolves.toEqual({
      imageUrl:
        'http://localhost:3002/media/images/profile-images/user_123/new.png',
    });

    expect(execute).toHaveBeenCalledWith(
      new UpdateUserProfileCommand('user_123', {
        imageUrl:
          'http://localhost:3002/media/images/profile-images/user_123/new.png',
      }),
    );
    expect(deleteImageByUrl).toHaveBeenCalledWith(
      'http://localhost:3002/media/images/profile-images/user_123/old.png',
    );
  });

  it('cleans up the uploaded object when the profile update fails', async () => {
    const deleteImageByUrl = jest.fn().mockResolvedValue(undefined);
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute: jest.fn().mockRejectedValue(new Error('db failed')) } as never,
      {
        uploadImage: jest.fn().mockResolvedValue({
          imageUrl:
            'http://localhost:3002/media/images/profile-images/user_123/new.png',
        }),
        deleteImageByUrl,
      } as never,
      { findById: jest.fn().mockResolvedValue({ imageUrl: null }) } as never,
    );

    await expect(
      controller.uploadProfileImage({} as never, {} as ImageUploadFile),
    ).rejects.toThrow('db failed');

    expect(deleteImageByUrl).toHaveBeenCalledWith(
      'http://localhost:3002/media/images/profile-images/user_123/new.png',
    );
  });

  it('clears the profile image and deletes the previous object', async () => {
    const execute = jest.fn().mockResolvedValue({});
    const deleteImageByUrl = jest.fn().mockResolvedValue(undefined);
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute } as never,
      { deleteImageByUrl } as never,
      {
        findById: jest.fn().mockResolvedValue({
          imageUrl:
            'http://localhost:3002/media/images/profile-images/user_123/old.png',
        }),
      } as never,
    );

    await expect(controller.deleteProfileImage({} as never)).resolves.toEqual({
      imageUrl: null,
    });
    expect(execute).toHaveBeenCalledWith(
      new UpdateUserProfileCommand('user_123', { imageUrl: null }),
    );
    expect(deleteImageByUrl).toHaveBeenCalledWith(
      'http://localhost:3002/media/images/profile-images/user_123/old.png',
    );
  });

  it('rejects unauthenticated uploads', async () => {
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: null }) } as never,
      { execute: jest.fn() } as never,
      { uploadImage: jest.fn(), deleteImageByUrl: jest.fn() } as never,
      { findById: jest.fn() } as never,
    );

    await expect(
      controller.uploadProfileImage({} as never, {} as ImageUploadFile),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('ImageController', () => {
  it('rejects unauthenticated image reads', async () => {
    const controller = new ImageController(
      { create: jest.fn().mockResolvedValue({ userId: null }) } as never,
      { getImageByObjectName: jest.fn() } as never,
    );

    await expect(
      controller.getImage(
        { headers: {} } as never,
        responseDouble() as never,
        ['profile-images', 'user_123', 'avatar.png'],
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('streams authenticated image reads with cache headers', async () => {
    const content = Readable.from(Buffer.from('image'));
    const response = responseDouble();
    const controller = new ImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      {
        getImageByObjectName: jest.fn().mockResolvedValue({
          content,
          contentLength: 5,
          contentType: 'image/png',
          etag: '"etag-1"',
        }),
      } as never,
    );

    await controller.getImage(
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
  });

  it('returns 304 when the ETag matches', async () => {
    const response = responseDouble();
    const controller = new ImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      {
        getImageByObjectName: jest.fn().mockResolvedValue({
          content: Readable.from(Buffer.from('image')),
          contentLength: 5,
          contentType: 'image/png',
          etag: '"etag-1"',
        }),
      } as never,
    );

    await controller.getImage(
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
