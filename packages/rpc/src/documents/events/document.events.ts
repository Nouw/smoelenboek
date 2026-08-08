import type { ContentCollectionKind } from '@repo/api';

import { DomainEventBase } from '../../event-store/domain-event';

export const COLLECTION_SAVED_EVENT = 'documents.collection_saved';
export const COLLECTIONS_REORDERED_EVENT = 'documents.collections_reordered';
export const COLLECTION_DELETED_EVENT = 'documents.collection_deleted';
export const ASSET_SAVED_EVENT = 'documents.asset_saved';
export const ASSETS_REORDERED_EVENT = 'documents.assets_reordered';
export const ASSET_DELETED_EVENT = 'documents.asset_deleted';

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

export class CollectionSavedEvent extends DomainEventBase<CollectionSnapshotPayload, AdminMetadata> {
  readonly aggregateType = 'content_collection';
  readonly eventType = COLLECTION_SAVED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.collectionId; }
  static create(payload: CollectionSnapshotPayload, actorId: string): CollectionSavedEvent {
    return new CollectionSavedEvent(payload, { source: 'admin', actorId });
  }
}

export class CollectionsReorderedEvent extends DomainEventBase<ReorderPayload, AdminMetadata> {
  readonly aggregateType = 'content_collection';
  readonly eventType = COLLECTIONS_REORDERED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.scopeId; }
  static create(payload: ReorderPayload, actorId: string): CollectionsReorderedEvent {
    return new CollectionsReorderedEvent(payload, { source: 'admin', actorId });
  }
}

export class CollectionDeletedEvent extends DomainEventBase<DeletePayload, AdminMetadata> {
  readonly aggregateType = 'content_collection';
  readonly eventType = COLLECTION_DELETED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.id; }
  static create(payload: DeletePayload, actorId: string): CollectionDeletedEvent {
    return new CollectionDeletedEvent(payload, { source: 'admin', actorId });
  }
}

export class AssetSavedEvent extends DomainEventBase<AssetSnapshotPayload, AdminMetadata> {
  readonly aggregateType = 'content_asset';
  readonly eventType = ASSET_SAVED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.assetId; }
  static create(
    payload: AssetSnapshotPayload,
    actorId: string,
    source: AdminMetadata['source'] = 'admin',
  ): AssetSavedEvent {
    return new AssetSavedEvent(payload, { source, actorId });
  }
}

export class AssetsReorderedEvent extends DomainEventBase<ReorderPayload, AdminMetadata> {
  readonly aggregateType = 'content_asset';
  readonly eventType = ASSETS_REORDERED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.scopeId; }
  static create(payload: ReorderPayload, actorId: string): AssetsReorderedEvent {
    return new AssetsReorderedEvent(payload, { source: 'admin', actorId });
  }
}

export class AssetDeletedEvent extends DomainEventBase<DeletePayload, AdminMetadata> {
  readonly aggregateType = 'content_asset';
  readonly eventType = ASSET_DELETED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.id; }
  static create(payload: DeletePayload, actorId: string): AssetDeletedEvent {
    return new AssetDeletedEvent(payload, { source: 'admin', actorId });
  }
}
