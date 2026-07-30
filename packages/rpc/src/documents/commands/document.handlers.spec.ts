import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

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

function eventStoreDouble() {
  return {
    appendPreparedAndProject: jest.fn(
      async (
        prepare: (manager: unknown) => Promise<unknown>,
      ) => prepare({}),
    ),
  };
}

describe('document command policies', () => {
  it('creates a collection at the end of its season and kind scope', async () => {
    const events = eventStoreDouble();
    const repository = {
      lockCollectionGroup: jest.fn().mockResolvedValue(undefined),
      listCollectionGroup: jest.fn().mockResolvedValue([{ id: 'existing' }]),
    };
    const handler = new CreateContentCollectionHandler(
      events as never,
      {} as never,
      repository as never,
    );

    const event = (await handler.execute(
      new CreateContentCollectionCommand(
        'admin-1',
        'Home day',
        null,
        'photo_album',
        2025,
      ),
    )) as unknown as { payload: { position: number; seasonKey: number } };

    expect(event.payload).toEqual(
      expect.objectContaining({ position: 1, seasonKey: 2025 }),
    );
  });

  it('rejects cross-scope or incomplete collection ordering', async () => {
    const events = eventStoreDouble();
    const handler = new ReorderContentCollectionsHandler(
      events as never,
      {} as never,
      {
        lockCollectionGroup: jest.fn().mockResolvedValue(undefined),
        listCollectionGroup: jest
          .fn()
          .mockResolvedValue([{ id: 'one' }, { id: 'two' }]),
      } as never,
    );

    await expect(
      handler.execute(
        new ReorderContentCollectionsCommand(
          'admin-1',
          2025,
          'document_library',
          ['one'],
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires a cover to be an asset in the target photo album', async () => {
    const events = eventStoreDouble();
    const handler = new SetContentCollectionCoverHandler(
      events as never,
      {} as never,
      {
        findCollection: jest.fn().mockResolvedValue({
          id: 'album-1',
          kind: 'photo_album',
        }),
        findAsset: jest.fn().mockResolvedValue({
          id: 'asset-1',
          collectionId: 'album-2',
        }),
      } as never,
    );

    await expect(
      handler.execute(
        new SetContentCollectionCoverCommand('admin-1', 'album-1', 'asset-1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('includes every original and thumbnail in collection cleanup events', async () => {
    const events = eventStoreDouble();
    const handler = new DeleteContentCollectionHandler(
      events as never,
      {} as never,
      {
        findCollection: jest.fn().mockResolvedValue({
          id: 'album-1',
        }),
        listAssets: jest.fn().mockResolvedValue([
            {
              objectName: 'photobooks/album-1/original/asset.jpg',
              thumbnailObjectName:
                'photobooks/album-1/thumbnail/asset.webp',
            },
          ]),
      } as never,
    );

    const event = (await handler.execute(
      new DeleteContentCollectionCommand('admin-1', 'album-1'),
    )) as unknown as { payload: { objectNames: string[] } };

    expect(event.payload.objectNames).toEqual([
      'photobooks/album-1/original/asset.jpg',
      'photobooks/album-1/thumbnail/asset.webp',
    ]);
  });
});
