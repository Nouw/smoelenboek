import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

import { type ImageUploadFile, MediaService } from './media.service';

const originalEnv = process.env;

describe('MediaService', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      OCI_REGION: 'eu-amsterdam-1',
      OCI_TENANCY_OCID: 'ocid1.tenancy.oc1..example',
      OCI_USER_OCID: 'ocid1.user.oc1..example',
      OCI_FINGERPRINT: '00:11:22:33',
      OCI_PRIVATE_KEY: 'private-key',
      OCI_OBJECT_STORAGE_NAMESPACE: 'namespace',
      OCI_OBJECT_STORAGE_BUCKET: 'bucket',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('uploads valid image files to an owned object key', async () => {
    const putObject = jest.fn().mockResolvedValue({});
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ putObject });

    const result = await service.uploadImage(
      'profile-images',
      'user_123',
      imageFile({ mimetype: 'image/png', originalname: 'avatar.png' }),
    );

    expect(result.objectName).toMatch(
      /^profile-images\/user_123\/[0-9a-f-]+\.png$/,
    );
    expect(result.imageUrl).toBe(
      `https://objectstorage.eu-amsterdam-1.oraclecloud.com/n/namespace/b/bucket/o/${result.objectName}`,
    );
    expect(putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        namespaceName: 'namespace',
        bucketName: 'bucket',
        objectName: result.objectName,
        contentType: 'image/png',
        contentLength: 4,
      }),
    );
  });

  it('rejects unsupported image MIME types', async () => {
    const service = new MediaService();

    await expect(
      service.uploadImage(
        'profile-images',
        'user_123',
        imageFile({ mimetype: 'image/svg+xml', originalname: 'avatar.svg' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects files larger than 5 MB', async () => {
    const service = new MediaService();

    await expect(
      service.uploadImage(
        'profile-images',
        'user_123',
        imageFile({
          mimetype: 'image/jpeg',
          originalname: 'avatar.jpg',
          size: 5 * 1024 * 1024 + 1,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes only URLs belonging to the configured bucket', async () => {
    const deleteObject = jest.fn().mockResolvedValue({});
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ deleteObject });

    await service.deleteImageByUrl(
      'https://objectstorage.eu-amsterdam-1.oraclecloud.com/n/namespace/b/bucket/o/profile-images/user_123/avatar.png',
    );
    await service.deleteImageByUrl('https://example.com/avatar.png');

    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject).toHaveBeenCalledWith({
      namespaceName: 'namespace',
      bucketName: 'bucket',
      objectName: 'profile-images/user_123/avatar.png',
    });
  });

  it('supports a custom public base URL', async () => {
    process.env.OCI_OBJECT_STORAGE_PUBLIC_BASE_URL = 'https://cdn.example.com/images/';
    const deleteObject = jest.fn().mockResolvedValue({});
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ deleteObject });

    await service.deleteImageByUrl(
      'https://cdn.example.com/images/profile-images/user_123/avatar.png',
    );

    expect(deleteObject).toHaveBeenCalledWith(
      expect.objectContaining({
        objectName: 'profile-images/user_123/avatar.png',
      }),
    );
  });
});

function imageFile(
  options: {
    mimetype: string;
    originalname: string;
    size?: number;
  },
): ImageUploadFile {
  const buffer = Buffer.from('test');

  return {
    originalname: options.originalname,
    mimetype: options.mimetype,
    size: options.size ?? buffer.length,
    buffer,
  };
}
