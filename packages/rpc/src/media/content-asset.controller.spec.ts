import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { Writable } from 'node:stream';

import type { ImageUploadFile } from './media.service';
import {
  ContentAssetController,
  ContentAssetUploadController,
  contentDispositionForTest,
} from './content-asset.controller';

describe('contentDisposition', () => {
  it('preserves UTF-8 names without allowing response-header injection', () => {
    expect(contentDispositionForTest('Teamkaart é\r\nX.pdf', true)).toBe(
      `attachment; filename="Teamkaart _X.pdf"; filename*=UTF-8''Teamkaart%20%C3%A9X.pdf`,
    );
  });
});

describe('ContentAssetUploadController', () => {
  it('rejects non-admin uploads before reading the collection', async () => {
    const findCollection = jest.fn();
    const controller = new ContentAssetUploadController(
      {
        create: jest.fn().mockResolvedValue({
          userId: 'member-1',
          role: 'user',
          passwordMigrationRequired: false,
        }),
      } as never,
      { execute: jest.fn() } as never,
      { findCollection } as never,
      {} as never,
    );

    await expect(
      controller.upload({} as never, 'collection-1', {} as ImageUploadFile),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findCollection).not.toHaveBeenCalled();
  });

  it('removes uploaded objects when metadata persistence fails', async () => {
    const deleteObjectByName = jest.fn().mockResolvedValue(undefined);
    const controller = new ContentAssetUploadController(
      {
        create: jest.fn().mockResolvedValue({
          userId: 'admin-1',
          role: 'admin',
          passwordMigrationRequired: true,
        }),
      } as never,
      {
        execute: jest.fn().mockRejectedValue(new Error('database failed')),
      } as never,
      {
        findCollection: jest.fn().mockResolvedValue({
          id: 'collection-1',
          kind: 'photo_album',
        }),
      } as never,
      {
        uploadContentAsset: jest.fn().mockResolvedValue({
          objectName: 'photobooks/collection-1/original/object.jpg',
          thumbnailObjectName: 'photobooks/collection-1/thumbnail/object.webp',
          contentType: 'image/jpeg',
          sizeBytes: 4,
        }),
        deleteObjectByName,
      } as never,
    );

    await expect(
      controller.upload({} as never, 'collection-1', {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 4,
        buffer: Buffer.from('test'),
      }),
    ).rejects.toThrow('database failed');
    expect(deleteObjectByName).toHaveBeenCalledTimes(2);
  });

  it('durably queues objects when upload compensation keeps failing', async () => {
    const enqueueObjectCleanup = jest.fn().mockResolvedValue(undefined);
    const controller = new ContentAssetUploadController(
      {
        create: jest.fn().mockResolvedValue({
          userId: 'admin-1',
          role: 'admin',
          passwordMigrationRequired: false,
        }),
      } as never,
      {
        execute: jest.fn().mockRejectedValue(new Error('database failed')),
      } as never,
      {
        findCollection: jest.fn().mockResolvedValue({
          id: 'collection-1',
          kind: 'document_library',
        }),
        enqueueObjectCleanup,
      } as never,
      {
        uploadContentAsset: jest.fn().mockResolvedValue({
          objectName: 'documents/collection-1/original/object.pdf',
          thumbnailObjectName: null,
          contentType: 'application/pdf',
          sizeBytes: 4,
        }),
        deleteObjectByName: jest.fn().mockRejectedValue(new Error('OCI down')),
      } as never,
    );

    await expect(
      controller.upload({} as never, 'collection-1', {
        originalname: 'map.pdf',
        mimetype: 'application/pdf',
        size: 4,
        buffer: Buffer.from('test'),
      }),
    ).rejects.toThrow('database failed');
    expect(enqueueObjectCleanup).toHaveBeenCalledWith([
      'documents/collection-1/original/object.pdf',
    ]);
  });
});

describe('ContentAssetController', () => {
  it('allows a member with a legacy credential to request protected content', async () => {
    const controller = new ContentAssetController(
      {
        create: jest.fn().mockResolvedValue({
          userId: 'member-1',
          passwordMigrationRequired: true,
        }),
      } as never,
      { findAsset: jest.fn().mockResolvedValue(null) } as never,
      { getObjectByName: jest.fn() } as never,
    );

    await expect(
      controller.content(
        { headers: {} } as never,
        responseDouble() as never,
        'asset-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function responseDouble() {
  const writable = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  }) as Writable & {
    setHeader: jest.Mock;
    status: jest.Mock;
    end: jest.Mock;
  };
  writable.setHeader = jest.fn();
  writable.status = jest.fn().mockReturnValue(writable);
  writable.end = jest.fn();
  return writable;
}
