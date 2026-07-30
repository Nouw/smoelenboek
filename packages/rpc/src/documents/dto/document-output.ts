type ContentAssetRecord = {
  id: string;
  collectionId: string;
  originalName: string;
  mimeType: string;
  byteSize: string;
  title: string | null;
  caption: string | null;
  position: number;
  thumbnailObjectName: string | null;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ContentCollectionRecord = {
  id: string;
  name: string;
  description: string | null;
  kind: 'photo_album' | 'document_library';
  seasonKey: number;
  position: number;
  coverAssetId: string | null;
  assets?: ContentAssetRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export function toContentAssetOutput(asset: ContentAssetRecord) {
  return {
    id: asset.id,
    collectionId: asset.collectionId,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    byteSize: Number(asset.byteSize),
    title: asset.title,
    caption: asset.caption,
    position: asset.position,
    hasThumbnail: asset.thumbnailObjectName !== null,
    uploadedBy: asset.uploadedBy,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export function toContentCollectionOutput(
  collection: ContentCollectionRecord,
) {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    kind: collection.kind,
    seasonKey: collection.seasonKey,
    position: collection.position,
    coverAssetId: collection.coverAssetId,
    assetCount: collection.assets?.length ?? 0,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

export function toContentCollectionDetailOutput(
  collection: ContentCollectionRecord,
) {
  return {
    ...toContentCollectionOutput(collection),
    assets: (collection.assets ?? [])
      .sort((left, right) => left.position - right.position)
      .map(toContentAssetOutput),
  };
}
