import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { Readable } from 'node:stream';

import {
  type ImageUploadFile,
  MediaService,
  MediaUploadCompensationError,
} from './media.service';

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
      BETTER_AUTH_URL: 'http://localhost:3002',
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
      `http://localhost:3002/media/objects/${result.objectName}`,
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

  it('deletes RPC object URLs and ignores external URLs', async () => {
    const deleteObject = jest.fn().mockResolvedValue({});
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ deleteObject });

    await service.deleteImageByUrl(
      'http://localhost:3002/media/objects/profile-images/user_123/avatar.png',
    );
    await service.deleteImageByUrl('https://example.com/avatar.png');
    await service.deleteImageByUrl(
      'http://localhost:3002/media/images/profile-images/%',
    );

    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject).toHaveBeenCalledWith({
      namespaceName: 'namespace',
      bucketName: 'bucket',
      objectName: 'profile-images/user_123/avatar.png',
    });
  });

  it('deletes legacy RPC image URLs', async () => {
    const deleteObject = jest.fn().mockResolvedValue({});
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ deleteObject });

    await service.deleteObjectByUrl(
      'http://localhost:3002/media/images/profile-images/user_123/avatar.png',
    );

    expect(deleteObject).toHaveBeenCalledWith({
      namespaceName: 'namespace',
      bucketName: 'bucket',
      objectName: 'profile-images/user_123/avatar.png',
    });
  });

  it('deletes legacy OCI public URLs for cleanup', async () => {
    const deleteObject = jest.fn().mockResolvedValue({});
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ deleteObject });

    await service.deleteImageByUrl(
      'https://objectstorage.eu-amsterdam-1.oraclecloud.com/n/namespace/b/bucket/o/profile-images/user_123/avatar.png',
    );

    expect(deleteObject).toHaveBeenCalledWith(
      expect.objectContaining({
        objectName: 'profile-images/user_123/avatar.png',
      }),
    );
  });

  it('allows future photobook image object names', () => {
    const service = new MediaService();

    expect(() =>
      service.assertAllowedObjectName(
        'photobooks/album_123/thumb/image_456.webp',
      ),
    ).not.toThrow();
    expect(
      service.toRpcImageUrl('photobooks/album_123/original/image_456.jpg'),
    ).toBe(
      'http://localhost:3002/media/objects/photobooks/album_123/original/image_456.jpg',
    );
  });

  it('rejects unsupported object names', () => {
    const service = new MediaService();

    expect(() =>
      service.assertAllowedObjectName('documents/collection/original/secret.pdf'),
    ).not.toThrow();
    expect(() =>
      service.assertAllowedObjectName('private/secret.pdf'),
    ).toThrow(BadRequestException);
    expect(() =>
      service.assertAllowedObjectName('profile-images/../secret.png'),
    ).toThrow(BadRequestException);
  });

  it('uploads verified photo originals and generated thumbnails', async () => {
    const putObject = jest.fn().mockResolvedValue({});
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ putObject, deleteObject: jest.fn() });
    jest
      .spyOn(service as never, 'detectFileType')
      .mockResolvedValue({ ext: 'jpg', mime: 'image/jpeg' } as never);
    jest
      .spyOn(service as never, 'createThumbnail')
      .mockResolvedValue(Buffer.from('thumbnail') as never);

    const result = await service.uploadContentAsset(
      'photo_album',
      'collection-1',
      'asset-1',
      imageFile({ mimetype: 'image/jpeg', originalname: 'day.jpg' }),
    );

    expect(result).toEqual({
      objectName: 'photobooks/collection-1/original/asset-1.jpg',
      thumbnailObjectName: 'photobooks/collection-1/thumbnail/asset-1.webp',
      contentType: 'image/jpeg',
      sizeBytes: 4,
    });
    expect(putObject).toHaveBeenCalledTimes(2);
  });

  it('reports an orphaned original when thumbnail creation and cleanup fail', async () => {
    const putObject = jest.fn().mockResolvedValue({});
    const deleteObject = jest.fn().mockRejectedValue(new Error('OCI down'));
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ putObject, deleteObject });
    jest
      .spyOn(service as never, 'detectFileType')
      .mockResolvedValue({ ext: 'jpg', mime: 'image/jpeg' } as never);
    jest
      .spyOn(service as never, 'createThumbnail')
      .mockRejectedValue(new Error('invalid image') as never);

    const upload = service.uploadContentAsset(
      'photo_album',
      'collection-1',
      'asset-1',
      imageFile({ mimetype: 'image/jpeg', originalname: 'day.jpg' }),
    );

    await expect(upload).rejects.toMatchObject({
      name: MediaUploadCompensationError.name,
      orphanedObjectNames: [
        'photobooks/collection-1/original/asset-1.jpg',
      ],
    });
    expect(deleteObject).toHaveBeenCalledTimes(1);
  });

  it('accepts verified PDF documents without creating thumbnails', async () => {
    const putObject = jest.fn().mockResolvedValue({});
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ putObject });
    jest
      .spyOn(service as never, 'detectFileType')
      .mockResolvedValue({ ext: 'pdf', mime: 'application/pdf' } as never);

    await expect(
      service.uploadContentAsset(
        'document_library',
        'collection-1',
        'asset-1',
        imageFile({ mimetype: 'application/pdf', originalname: 'map.pdf' }),
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        objectName: 'documents/collection-1/original/asset-1.pdf',
        thumbnailObjectName: null,
        contentType: 'application/pdf',
      }),
    );
    expect(putObject).toHaveBeenCalledTimes(1);
  });

  it('rejects files whose bytes do not identify an allowed type', async () => {
    const service = new MediaService();
    jest.spyOn(service as never, 'detectFileType').mockResolvedValue(undefined as never);

    await expect(
      service.uploadContentAsset(
        'document_library',
        'collection-1',
        'asset-1',
        imageFile({ mimetype: 'application/pdf', originalname: 'fake.pdf' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects verified documents in photo albums', async () => {
    const service = new MediaService();
    jest
      .spyOn(service as never, 'detectFileType')
      .mockResolvedValue({ ext: 'pdf', mime: 'application/pdf' } as never);

    await expect(
      service.uploadContentAsset(
        'photo_album',
        'collection-1',
        'asset-1',
        imageFile({ mimetype: 'application/pdf', originalname: 'map.pdf' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('loads objects from OCI with stream metadata', async () => {
    const content = Readable.from(Buffer.from('image'));
    const getObject = jest.fn().mockResolvedValue({
      value: {
        content,
        contentLength: 5,
        contentType: 'image/png',
        eTag: '"etag-1"',
      },
    });
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ getObject });

    await expect(
      service.getObjectByName('profile-images/user_123/avatar.png'),
    ).resolves.toEqual({
      content,
      contentLength: 5,
      contentType: 'image/png',
      etag: '"etag-1"',
    });
  });

  it('loads objects from the OCI SDK response body', async () => {
    const content = Readable.from(Buffer.from('image'));
    const getObject = jest.fn().mockResolvedValue({
      value: content,
      contentLength: 5,
      contentType: 'image/webp',
      eTag: '"etag-2"',
    });
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ getObject });

    await expect(
      service.getObjectByName('profile-images/user_123/avatar.webp'),
    ).resolves.toEqual({
      content,
      contentLength: 5,
      contentType: 'image/webp',
      etag: '"etag-2"',
    });
  });

  it('loads objects from web stream response bodies', async () => {
    const getObject = jest.fn().mockResolvedValue({
      value: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('image'));
          controller.close();
        },
      }),
      contentLength: 5,
      contentType: 'image/webp',
      eTag: '"etag-3"',
    });
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ getObject });

    const object = await service.getObjectByName(
      'profile-images/user_123/avatar.webp',
    );

    await expect(readAll(object.content)).resolves.toBe('image');
    expect(object.contentLength).toBe(5);
    expect(object.contentType).toBe('image/webp');
    expect(object.etag).toBe('"etag-3"');
  });

  it('loads objects from byte array response bodies', async () => {
    const getObject = jest.fn().mockResolvedValue({
      value: new Uint8Array(Buffer.from('image')),
      contentLength: 5,
      contentType: 'image/webp',
      eTag: '"etag-4"',
    });
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ getObject });

    const object = await service.getObjectByName(
      'profile-images/user_123/avatar.webp',
    );

    await expect(readAll(object.content)).resolves.toBe('image');
    expect(object.contentLength).toBe(5);
    expect(object.contentType).toBe('image/webp');
    expect(object.etag).toBe('"etag-4"');
  });

  it('maps OCI 404 responses to NotFoundException', async () => {
    const getObject = jest.fn().mockRejectedValue({ statusCode: 404 });
    const service = new MediaService();
    (service as unknown as { clientPromise: Promise<unknown> }).clientPromise =
      Promise.resolve({ getObject });

    await expect(
      service.getObjectByName('profile-images/user_123/missing.png'),
    ).rejects.toBeInstanceOf(NotFoundException);
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

async function readAll(readable: Readable): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of readable) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else if (chunk instanceof Uint8Array) {
      chunks.push(Buffer.from(chunk));
    } else if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    }
  }

  return Buffer.concat(chunks).toString();
}
