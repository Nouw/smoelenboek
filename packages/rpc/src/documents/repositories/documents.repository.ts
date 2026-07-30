import type { ContentCollectionKind } from '@repo/api';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, LessThanOrEqual, Repository } from 'typeorm';

import { ContentAssetEntity } from '../entities/content-asset.entity';
import { ContentCollectionEntity } from '../entities/content-collection.entity';
import { ContentObjectCleanupEntity } from '../entities/content-object-cleanup.entity';

@Injectable()
export class DocumentsRepository {
  constructor(
    @InjectRepository(ContentCollectionEntity)
    private readonly collections: Repository<ContentCollectionEntity>,
    @InjectRepository(ContentAssetEntity)
    private readonly assets: Repository<ContentAssetEntity>,
    @InjectRepository(ContentObjectCleanupEntity)
    private readonly cleanup: Repository<ContentObjectCleanupEntity>,
  ) {}

  findCollection(
    id: string,
    manager?: EntityManager,
    lock = false,
  ): Promise<ContentCollectionEntity | null> {
    return (
      manager?.getRepository(ContentCollectionEntity) ?? this.collections
    ).findOne({
      where: { id },
      ...(lock
        ? { lock: { mode: 'pessimistic_write' as const } }
        : {
            relations: { assets: true },
            order: { assets: { position: 'ASC' as const } },
          }),
    });
  }

  listCollections(filters?: {
    seasonKey?: number;
    kind?: ContentCollectionKind;
  }): Promise<ContentCollectionEntity[]> {
    return this.collections.find({
      where: {
        ...(filters?.seasonKey === undefined
          ? {}
          : { seasonKey: filters.seasonKey }),
        ...(filters?.kind === undefined ? {} : { kind: filters.kind }),
      },
      relations: { assets: true },
      order: { seasonKey: 'DESC', kind: 'ASC', position: 'ASC' },
    });
  }

  listCollectionGroup(
    seasonKey: number,
    kind: ContentCollectionKind,
    manager?: EntityManager,
    lock = false,
  ): Promise<ContentCollectionEntity[]> {
    return (manager?.getRepository(ContentCollectionEntity) ?? this.collections)
      .find({
        where: { seasonKey, kind },
        order: { position: 'ASC' },
        ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
      });
  }

  async lockCollectionGroup(
    seasonKey: number,
    kind: ContentCollectionKind,
    manager: EntityManager,
  ): Promise<void> {
    await manager.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [`content-collections:${seasonKey}:${kind}`],
    );
  }

  findAsset(
    id: string,
    manager?: EntityManager,
    lock = false,
  ): Promise<ContentAssetEntity | null> {
    return (manager?.getRepository(ContentAssetEntity) ?? this.assets).findOne({
      where: { id },
      ...(lock
        ? { lock: { mode: 'pessimistic_write' as const } }
        : { relations: { collection: true } }),
    });
  }

  listAssets(
    collectionId: string,
    manager?: EntityManager,
    lock = false,
  ): Promise<ContentAssetEntity[]> {
    return (manager?.getRepository(ContentAssetEntity) ?? this.assets).find({
      where: { collectionId },
      order: { position: 'ASC' },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
  }

  listPendingCleanup(
    now = new Date(),
    limit = 100,
  ): Promise<ContentObjectCleanupEntity[]> {
    return this.cleanup.find({
      where: [
        { nextAttemptAt: LessThanOrEqual(now) },
        { nextAttemptAt: IsNull() },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async markCleanupFailed(id: string, error: string, retryAt: Date) {
    await this.cleanup.increment({ id }, 'attempts', 1);
    await this.cleanup.update(id, { lastError: error, nextAttemptAt: retryAt });
  }

  async completeCleanup(id: string): Promise<void> {
    await this.cleanup.delete(id);
  }

  async enqueueObjectCleanup(objectNames: string[]): Promise<void> {
    const names = [...new Set(objectNames.filter(Boolean))];
    if (names.length === 0) return;
    await this.cleanup
      .createQueryBuilder()
      .insert()
      .values(names.map((objectName) => ({ objectName })))
      .orIgnore()
      .execute();
  }
}
