import { describe, expect, it } from '@jest/globals';

import {
  toContentAssetOutput,
  toContentCollectionDetailOutput,
} from './document-output';

describe('document output', () => {
  it('does not expose OCI object names', () => {
    const at = new Date('2026-07-30T12:00:00.000Z');
    const asset = {
      id: '7c182774-7382-4a8b-a76d-b1cd09e21c9e',
      collectionId: '27c68ec3-507f-4513-93c9-2d4f17235592',
      objectName: 'documents/private-object',
      thumbnailObjectName: 'documents/private-thumbnail',
      originalName: 'team-map.pdf',
      mimeType: 'application/pdf',
      byteSize: '42',
      title: null,
      caption: null,
      position: 0,
      uploadedBy: null,
      createdAt: at,
      updatedAt: at,
    };

    expect(toContentAssetOutput(asset)).toEqual(
      expect.objectContaining({
        byteSize: 42,
        hasThumbnail: true,
        createdAt: at.toISOString(),
      }),
    );
    expect(toContentAssetOutput(asset)).not.toHaveProperty('objectName');
    expect(toContentAssetOutput(asset)).not.toHaveProperty(
      'thumbnailObjectName',
    );
  });

  it('orders assets by their persisted manual position', () => {
    const at = new Date('2026-07-30T12:00:00.000Z');
    const makeAsset = (id: string, position: number) => ({
      id,
      collectionId: '27c68ec3-507f-4513-93c9-2d4f17235592',
      originalName: `${id}.jpg`,
      mimeType: 'image/jpeg',
      byteSize: '1',
      title: null,
      caption: null,
      position,
      thumbnailObjectName: null,
      uploadedBy: null,
      createdAt: at,
      updatedAt: at,
    });
    const output = toContentCollectionDetailOutput({
      id: '27c68ec3-507f-4513-93c9-2d4f17235592',
      name: 'Home day',
      description: null,
      kind: 'photo_album',
      seasonKey: 2025,
      position: 0,
      coverAssetId: null,
      assets: [makeAsset('second', 1), makeAsset('first', 0)],
      createdAt: at,
      updatedAt: at,
    });

    expect(output.assets.map(({ originalName }) => originalName)).toEqual([
      'first.jpg',
      'second.jpg',
    ]);
  });
});
