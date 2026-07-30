import type { ContentCollectionKind } from '@repo/api';

import type { DomainEvent } from '../../event-store/events';

export type CollectionSnapshotPayload = {
  collectionId: string;
  name: string;
  description: string | null;
  kind: ContentCollectionKind;
  seasonKey: number;
  position: number;
  coverAssetId: string | null;
};

export type AssetSnapshotPayload = {
  assetId: string;
  collectionId: string;
  objectName: string;
  thumbnailObjectName: string | null;
  originalName: string;
  mimeType: string;
  byteSize: string;
  title: string | null;
  caption: string | null;
  position: number;
  uploadedBy: string | null;
};

export type ReorderPayload = {
  scopeId: string;
  positions: Array<{ id: string; position: number }>;
};

export type DeletePayload = {
  id: string;
  objectNames: string[];
};

type AdminMetadata = { source: 'admin' | 'media'; actorId: string };

function event<T extends Record<string, unknown>>(
  aggregateType: 'content_collection' | 'content_asset',
  aggregateId: string,
  eventType: string,
  payload: T,
  actorId: string,
  source: AdminMetadata['source'] = 'admin',
): DomainEvent<T, AdminMetadata> {
  return {
    aggregateType,
    aggregateId,
    eventType,
    eventVersion: 1,
    payload,
    metadata: { source, actorId },
  };
}

export const collectionSavedEvent = (
  payload: CollectionSnapshotPayload,
  actorId: string,
) =>
  event(
    'content_collection',
    payload.collectionId,
    'documents.collection_saved',
    payload,
    actorId,
  );

export const collectionsReorderedEvent = (
  payload: ReorderPayload,
  actorId: string,
) =>
  event(
    'content_collection',
    payload.scopeId,
    'documents.collections_reordered',
    payload,
    actorId,
  );

export const collectionDeletedEvent = (
  payload: DeletePayload,
  actorId: string,
) =>
  event(
    'content_collection',
    payload.id,
    'documents.collection_deleted',
    payload,
    actorId,
  );

export const assetSavedEvent = (
  payload: AssetSnapshotPayload,
  actorId: string,
  source: AdminMetadata['source'] = 'admin',
) =>
  event(
    'content_asset',
    payload.assetId,
    'documents.asset_saved',
    payload,
    actorId,
    source,
  );

export const assetsReorderedEvent = (
  payload: ReorderPayload,
  actorId: string,
) =>
  event(
    'content_asset',
    payload.scopeId,
    'documents.assets_reordered',
    payload,
    actorId,
  );

export const assetDeletedEvent = (
  payload: DeletePayload,
  actorId: string,
) =>
  event(
    'content_asset',
    payload.id,
    'documents.asset_deleted',
    payload,
    actorId,
  );
