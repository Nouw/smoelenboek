import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ContentAssetEntity } from '../entities/content-asset.entity';
import { ContentCollectionEntity } from '../entities/content-collection.entity';
import { ContentObjectCleanupEntity } from '../entities/content-object-cleanup.entity';
import type {
  AssetSnapshotPayload,
  CollectionSnapshotPayload,
  DeletePayload,
  ReorderPayload,
} from '../events/document.events';

@Injectable()
export class DocumentsProjector {
  async projectCollection(
    payload: CollectionSnapshotPayload,
    manager: EntityManager,
  ): Promise<ContentCollectionEntity> {
    const repository = manager.getRepository(ContentCollectionEntity);
    const existing = await repository.findOne({
      where: { id: payload.collectionId },
      lock: { mode: 'pessimistic_write' },
    });
    const previousScope = existing
      ? { seasonKey: existing.seasonKey, kind: existing.kind }
      : null;
    const entity = existing ?? repository.create({ id: payload.collectionId });
    Object.assign(entity, {
      name: payload.name,
      description: payload.description,
      kind: payload.kind,
      seasonKey: payload.seasonKey,
      position: payload.position,
      coverAssetId: payload.coverAssetId,
    });
    const saved = await repository.save(entity);

    if (
      previousScope &&
      (previousScope.seasonKey !== payload.seasonKey ||
        previousScope.kind !== payload.kind)
    ) {
      await this.normalizeCollectionPositions(
        previousScope.seasonKey,
        previousScope.kind,
        manager,
      );
    }
    return saved;
  }

  async reorderCollections(
    payload: ReorderPayload,
    manager: EntityManager,
  ): Promise<ContentCollectionEntity[]> {
    const repository = manager.getRepository(ContentCollectionEntity);
    const entities = await repository.findByIds(
      payload.positions.map(({ id }) => id),
    );
    const byId = new Map(entities.map((entity) => [entity.id, entity]));
    const ordered = payload.positions.map(({ id, position }) => {
      const entity = byId.get(id);
      if (!entity) throw new Error(`Collection ${id} disappeared.`);
      entity.position = position;
      return entity;
    });
    return repository.save(ordered);
  }

  async deleteCollection(
    payload: DeletePayload,
    manager: EntityManager,
  ): Promise<string> {
    const repository = manager.getRepository(ContentCollectionEntity);
    const existing = await repository.findOneByOrFail({ id: payload.id });
    await this.enqueueObjectCleanup(payload.objectNames, manager);
    await repository.delete(payload.id);
    await this.normalizeCollectionPositions(
      existing.seasonKey,
      existing.kind,
      manager,
    );
    return payload.id;
  }

  async projectAsset(
    payload: AssetSnapshotPayload,
    manager: EntityManager,
  ): Promise<ContentAssetEntity> {
    await manager.getRepository(ContentCollectionEntity).findOneOrFail({
      where: { id: payload.collectionId },
      lock: { mode: 'pessimistic_write' },
    });
    const repository = manager.getRepository(ContentAssetEntity);
    const entity =
      (await repository.findOne({
        where: { id: payload.assetId },
        lock: { mode: 'pessimistic_write' },
      })) ?? repository.create({ id: payload.assetId });
    Object.assign(entity, {
      collectionId: payload.collectionId,
      objectName: payload.objectName,
      thumbnailObjectName: payload.thumbnailObjectName,
      originalName: payload.originalName,
      mimeType: payload.mimeType,
      byteSize: payload.byteSize,
      title: payload.title,
      caption: payload.caption,
      position: payload.position,
      uploadedBy: payload.uploadedBy,
    });
    return repository.save(entity);
  }

  async reorderAssets(
    payload: ReorderPayload,
    manager: EntityManager,
  ): Promise<ContentAssetEntity[]> {
    const repository = manager.getRepository(ContentAssetEntity);
    const entities = await repository.findByIds(
      payload.positions.map(({ id }) => id),
    );
    const byId = new Map(entities.map((entity) => [entity.id, entity]));
    const ordered = payload.positions.map(({ id, position }) => {
      const entity = byId.get(id);
      if (!entity) throw new Error(`Asset ${id} disappeared.`);
      entity.position = position;
      return entity;
    });
    return repository.save(ordered);
  }

  async deleteAsset(
    payload: DeletePayload,
    manager: EntityManager,
  ): Promise<string> {
    const assets = manager.getRepository(ContentAssetEntity);
    const asset = await assets.findOneByOrFail({ id: payload.id });
    await this.enqueueObjectCleanup(payload.objectNames, manager);
    await manager
      .getRepository(ContentCollectionEntity)
      .update({ coverAssetId: payload.id }, { coverAssetId: null });
    await assets.delete(payload.id);
    await this.normalizeAssetPositions(asset.collectionId, manager);
    return payload.id;
  }

  private async normalizeCollectionPositions(
    seasonKey: number,
    kind: ContentCollectionEntity['kind'],
    manager: EntityManager,
  ): Promise<void> {
    const repository = manager.getRepository(ContentCollectionEntity);
    const entities = await repository.find({
      where: { seasonKey, kind },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
    await repository.save(
      entities.map((entity, position) => Object.assign(entity, { position })),
    );
  }

  private async normalizeAssetPositions(
    collectionId: string,
    manager: EntityManager,
  ): Promise<void> {
    const repository = manager.getRepository(ContentAssetEntity);
    const entities = await repository.find({
      where: { collectionId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
    await repository.save(
      entities.map((entity, position) => Object.assign(entity, { position })),
    );
  }

  private async enqueueObjectCleanup(
    objectNames: string[],
    manager: EntityManager,
  ): Promise<void> {
    const names = [...new Set(objectNames.filter(Boolean))];
    if (names.length === 0) return;
    await manager
      .createQueryBuilder()
      .insert()
      .into(ContentObjectCleanupEntity)
      .values(names.map((objectName) => ({ objectName })))
      .orIgnore()
      .execute();
  }
}
