import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { UpdateUserProfileCommand } from '../users/commands/update-user-profile.command';
import type { ImageUploadFile } from './media.service';
import { ProfileImageController } from './profile-image.controller';

describe('ProfileImageController', () => {
  it('uploads a profile image, updates the user, and deletes the previous image', async () => {
    const execute = jest.fn().mockResolvedValue({});
    const deleteImageByUrl = jest.fn().mockResolvedValue(undefined);
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute } as never,
      {
        uploadImage: jest.fn().mockResolvedValue({
          imageUrl: 'https://cdn.example.com/profile-images/user_123/new.png',
        }),
        deleteImageByUrl,
      } as never,
      {
        findById: jest.fn().mockResolvedValue({
          imageUrl: 'https://cdn.example.com/profile-images/user_123/old.png',
        }),
      } as never,
    );

    await expect(
      controller.uploadProfileImage({} as never, {} as ImageUploadFile),
    ).resolves.toEqual({
      imageUrl: 'https://cdn.example.com/profile-images/user_123/new.png',
    });

    expect(execute).toHaveBeenCalledWith(
      new UpdateUserProfileCommand('user_123', {
        imageUrl: 'https://cdn.example.com/profile-images/user_123/new.png',
      }),
    );
    expect(deleteImageByUrl).toHaveBeenCalledWith(
      'https://cdn.example.com/profile-images/user_123/old.png',
    );
  });

  it('cleans up the uploaded object when the profile update fails', async () => {
    const deleteImageByUrl = jest.fn().mockResolvedValue(undefined);
    const controller = new ProfileImageController(
      { create: jest.fn().mockResolvedValue({ userId: 'user_123' }) } as never,
      { execute: jest.fn().mockRejectedValue(new Error('db failed')) } as never,
      {
        uploadImage: jest.fn().mockResolvedValue({
          imageUrl: 'https://cdn.example.com/profile-images/user_123/new.png',
        }),
        deleteImageByUrl,
      } as never,
      { findById: jest.fn().mockResolvedValue({ imageUrl: null }) } as never,
    );

    await expect(
      controller.uploadProfileImage({} as never, {} as ImageUploadFile),
    ).rejects.toThrow('db failed');

    expect(deleteImageByUrl).toHaveBeenCalledWith(
      'https://cdn.example.com/profile-images/user_123/new.png',
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
          imageUrl: 'https://cdn.example.com/profile-images/user_123/old.png',
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
      'https://cdn.example.com/profile-images/user_123/old.png',
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
