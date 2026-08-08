import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import {
  CollectionDeletedEvent,
  CollectionSavedEvent,
} from '../events/document.events';
import {
  CreateContentCollectionCommand,
  DeleteContentCollectionCommand,
  ReorderContentCollectionsCommand,
  SetContentCollectionCoverCommand,
} from './document.commands';
import {
  CreateContentCollectionHandler,
  DeleteContentCollectionHandler,
  ReorderContentCollectionsHandler,
  SetContentCollectionCoverHandler,
} from './document.handlers';

describe('document command policies', () => {
  it('creates a collection at the end of its season and kind scope', async () => {
    let capturedEvent: CollectionSavedEvent | null = null;
    const appendPreparedAndPublish = jest.fn(
      async (prepare: (manager: unknown) => Promise<CollectionSavedEvent>) => {
        capturedEvent = await prepare({});
      },
    );
    const repository = {
      lockCollectionGroup: jest.fn().mockResolvedValue(undefined),
      listCollectionGroup: jest.fn().mockResolvedValue([{ id: 'existing' }]),
      findCollection: jest.fn().mockResolvedValue({
        id: 'new-id',
        name: 'Home day',
        kind: 'photo_album',
        seasonKey: 2025,
        position: 1,
        description: null,
        coverAssetId: null,
        assets: [],
      }),
    };
    const handler = new CreateContentCollectionHandler(
      { appendPreparedAndPublish } as never,
      repository as never,
    );

    await handler.execute(
      new CreateContentCollectionCommand('admin-1', 'Home day', null, 'photo_album', 2025),
    );

    expect(capturedEvent).toBeInstanceOf(CollectionSavedEvent);
    expect(capturedEvent!.toRecord().payload).toEqual(
      expect.objectContaining({ position: 1, seasonKey: 2025 }),
    );
  });

  it('rejects cross-scope or incomplete collection ordering', async () => {
    const appendPreparedAndPublish = jest.fn(
      async (prepare: (manager: unknown) => Promise<unknown>) => { await prepare({}); },
    );
    const handler = new ReorderContentCollectionsHandler(
      { appendPreparedAndPublish } as never,
      {
        lockCollectionGroup: jest.fn().mockResolvedValue(undefined),
        listCollectionGroup: jest.fn().mockResolvedValue([{ id: 'one' }, { id: 'two' }]),
      } as never,
    );

    await expect(
      handler.execute(
        new ReorderContentCollectionsCommand('admin-1', 2025, 'document_library', ['one']),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires a cover to be an asset in the target photo album', async () => {
    const appendPreparedAndPublish = jest.fn(
      async (prepare: (manager: unknown) => Promise<unknown>) => { await prepare({}); },
    );
    const handler = new SetContentCollectionCoverHandler(
      { appendPreparedAndPublish } as never,
      {
        findCollection: jest.fn().mockResolvedValue({ id: 'album-1', kind: 'photo_album' }),
        findAsset: jest.fn().mockResolvedValue({ id: 'asset-1', collectionId: 'album-2' }),
      } as never,
    );

    await expect(
      handler.execute(new SetContentCollectionCoverCommand('admin-1', 'album-1', 'asset-1')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('includes every original and thumbnail in collection cleanup events', async () => {
    let capturedEvent: CollectionDeletedEvent | null = null;
    const appendPreparedAndPublish = jest.fn(
      async (prepare: (manager: unknown) => Promise<CollectionDeletedEvent>) => {
        capturedEvent = await prepare({});
      },
    );
    const handler = new DeleteContentCollectionHandler(
      { appendPreparedAndPublish } as never,
      {
        findCollection: jest.fn().mockResolvedValue({ id: 'album-1' }),
        listAssets: jest.fn().mockResolvedValue([
          {
            id: 'asset-1',
            mimeType: 'image/jpeg',
            byteSize: '12345',
            objectName: 'photobooks/album-1/original/asset.jpg',
            thumbnailObjectName: 'photobooks/album-1/thumbnail/asset.webp',
          },
        ]),
      } as never,
    );

    await handler.execute(new DeleteContentCollectionCommand('admin-1', 'album-1'));

    expect(capturedEvent).toBeInstanceOf(CollectionDeletedEvent);
    expect(capturedEvent!.toRecord().payload.objectNames).toEqual([
      'photobooks/album-1/original/asset.jpg',
      'photobooks/album-1/thumbnail/asset.webp',
    ]);
  });
});
