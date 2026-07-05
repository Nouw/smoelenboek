import { describe, expect, it, jest } from '@jest/globals';

import { UpdateUserProfileCommand } from '../../users/commands/update-user-profile.command';
import type { ImageUploadFile } from '../media.service';
import {
  DeleteProfileImageHandler,
  UploadProfileImageHandler,
} from './profile-image.handlers';
import {
  DeleteProfileImageCommand,
  UploadProfileImageCommand,
} from './profile-image.commands';

describe('UploadProfileImageHandler', () => {
  it('uploads a profile image, updates the user, and deletes the previous object', async () => {
    const execute = jest.fn().mockResolvedValue({});
    const deleteObjectByUrl = jest.fn().mockResolvedValue(undefined);
    const handler = new UploadProfileImageHandler(
      { execute } as never,
      {
        uploadImage: jest.fn().mockResolvedValue({
          imageUrl:
            'http://localhost:3002/media/objects/profile-images/user_123/new.png',
        }),
        deleteObjectByUrl,
      } as never,
      {
        findById: jest.fn().mockResolvedValue({
          imageUrl:
            'http://localhost:3002/media/images/profile-images/user_123/old.png',
        }),
      } as never,
    );

    await expect(
      handler.execute(new UploadProfileImageCommand('user_123', imageFile())),
    ).resolves.toEqual({
      imageUrl:
        'http://localhost:3002/media/objects/profile-images/user_123/new.png',
    });

    expect(execute).toHaveBeenCalledWith(
      new UpdateUserProfileCommand('user_123', {
        imageUrl:
          'http://localhost:3002/media/objects/profile-images/user_123/new.png',
      }),
    );
    expect(deleteObjectByUrl).toHaveBeenCalledWith(
      'http://localhost:3002/media/images/profile-images/user_123/old.png',
    );
  });

  it('cleans up the uploaded object when the profile update fails', async () => {
    const deleteObjectByUrl = jest.fn().mockResolvedValue(undefined);
    const handler = new UploadProfileImageHandler(
      {
        execute: jest.fn().mockRejectedValue(new Error('db failed')),
      } as never,
      {
        uploadImage: jest.fn().mockResolvedValue({
          imageUrl:
            'http://localhost:3002/media/objects/profile-images/user_123/new.png',
        }),
        deleteObjectByUrl,
      } as never,
      { findById: jest.fn().mockResolvedValue({ imageUrl: null }) } as never,
    );

    await expect(
      handler.execute(new UploadProfileImageCommand('user_123', imageFile())),
    ).rejects.toThrow('db failed');

    expect(deleteObjectByUrl).toHaveBeenCalledWith(
      'http://localhost:3002/media/objects/profile-images/user_123/new.png',
    );
  });
});

describe('DeleteProfileImageHandler', () => {
  it('clears the profile image and deletes the previous object', async () => {
    const execute = jest.fn().mockResolvedValue({});
    const deleteObjectByUrl = jest.fn().mockResolvedValue(undefined);
    const handler = new DeleteProfileImageHandler(
      { execute } as never,
      { deleteObjectByUrl } as never,
      {
        findById: jest.fn().mockResolvedValue({
          imageUrl:
            'http://localhost:3002/media/objects/profile-images/user_123/old.png',
        }),
      } as never,
    );

    await expect(
      handler.execute(new DeleteProfileImageCommand('user_123')),
    ).resolves.toEqual({ imageUrl: null });

    expect(execute).toHaveBeenCalledWith(
      new UpdateUserProfileCommand('user_123', { imageUrl: null }),
    );
    expect(deleteObjectByUrl).toHaveBeenCalledWith(
      'http://localhost:3002/media/objects/profile-images/user_123/old.png',
    );
  });
});

function imageFile(): ImageUploadFile {
  return {
    originalname: 'avatar.png',
    mimetype: 'image/png',
    size: 4,
    buffer: Buffer.from('test'),
  };
}
