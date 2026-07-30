import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { assertSeasonKey } from '../../seasons/season-policy';
import { ContentAssetEntity } from '../entities/content-asset.entity';
import { ContentCollectionEntity } from '../entities/content-collection.entity';
import {
  assetDeletedEvent,
  assetSavedEvent,
  assetsReorderedEvent,
  collectionDeletedEvent,
  collectionSavedEvent,
  collectionsReorderedEvent,
} from '../events/document.events';
import { DocumentsProjector } from '../projectors/documents.projector';
import { DocumentsRepository } from '../repositories/documents.repository';
import {
  AddContentAssetCommand,
  CreateContentCollectionCommand,
  DeleteContentAssetCommand,
  DeleteContentCollectionCommand,
  ReorderContentAssetsCommand,
  ReorderContentCollectionsCommand,
  SetContentCollectionCoverCommand,
  UpdateContentAssetCommand,
  UpdateContentCollectionCommand,
} from './document.commands';

@CommandHandler(CreateContentCollectionCommand)
export class CreateContentCollectionHandler
  implements
    ICommandHandler<CreateContentCollectionCommand, ContentCollectionEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  execute(
    command: CreateContentCollectionCommand,
  ): Promise<ContentCollectionEntity> {
    validateSeason(command.seasonKey);
    return this.events.appendPreparedAndProject(
      async (manager) => {
        await this.repository.lockCollectionGroup(
          command.seasonKey,
          command.kind,
          manager,
        );
        const group = await this.repository.listCollectionGroup(
          command.seasonKey,
          command.kind,
          manager,
          true,
        );
        return collectionSavedEvent(
          {
            collectionId: randomUUID(),
            name: command.name.trim(),
            description: normalizeOptional(command.description),
            kind: command.kind,
            seasonKey: command.seasonKey,
            position: group.length,
            coverAssetId: null,
          },
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.projectCollection(event.payload, manager),
    );
  }
}

@CommandHandler(UpdateContentCollectionCommand)
export class UpdateContentCollectionHandler
  implements
    ICommandHandler<UpdateContentCollectionCommand, ContentCollectionEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  execute(
    command: UpdateContentCollectionCommand,
  ): Promise<ContentCollectionEntity> {
    validateSeason(command.seasonKey);
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const existing = await this.repository.findCollection(
          command.collectionId,
          manager,
          true,
        );
        if (!existing) throw new NotFoundException('Collection not found.');
        const moving = existing.seasonKey !== command.seasonKey;
        if (moving) {
          await this.repository.lockCollectionGroup(
            command.seasonKey,
            existing.kind,
            manager,
          );
        }
        const target = moving
          ? await this.repository.listCollectionGroup(
              command.seasonKey,
              existing.kind,
              manager,
              true,
            )
          : [];
        return collectionSavedEvent(
          {
            collectionId: existing.id,
            name: command.name.trim(),
            description: normalizeOptional(command.description),
            kind: existing.kind,
            seasonKey: command.seasonKey,
            position: moving ? target.length : existing.position,
            coverAssetId: existing.coverAssetId,
          },
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.projectCollection(event.payload, manager),
    );
  }
}

@CommandHandler(ReorderContentCollectionsCommand)
export class ReorderContentCollectionsHandler
  implements
    ICommandHandler<
      ReorderContentCollectionsCommand,
      ContentCollectionEntity[]
    >
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  execute(
    command: ReorderContentCollectionsCommand,
  ): Promise<ContentCollectionEntity[]> {
    validateSeason(command.seasonKey);
    return this.events.appendPreparedAndProject(
      async (manager) => {
        await this.repository.lockCollectionGroup(
          command.seasonKey,
          command.kind,
          manager,
        );
        const group = await this.repository.listCollectionGroup(
          command.seasonKey,
          command.kind,
          manager,
          true,
        );
        assertExactOrder(group.map(({ id }) => id), command.collectionIds);
        return collectionsReorderedEvent(
          {
            scopeId: `${command.seasonKey}:${command.kind}`,
            positions: command.collectionIds.map((id, position) => ({
              id,
              position,
            })),
          },
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.reorderCollections(event.payload, manager),
    );
  }
}

@CommandHandler(DeleteContentCollectionCommand)
export class DeleteContentCollectionHandler
  implements ICommandHandler<DeleteContentCollectionCommand, string>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  async execute(command: DeleteContentCollectionCommand): Promise<string> {
    let deletedAssets: Array<{
      id: string;
      mimeType: string;
      byteSize: string;
    }> = [];
    const result = await this.events.appendPreparedAndProject(
      async (manager) => {
        const existing = await this.repository.findCollection(
          command.collectionId,
          manager,
          true,
        );
        if (!existing) throw new NotFoundException('Collection not found.');
        const assets = await this.repository.listAssets(
          existing.id,
          manager,
          true,
        );
        deletedAssets = assets.map(({ id, mimeType, byteSize }) => ({
          id,
          mimeType,
          byteSize,
        }));
        return collectionDeletedEvent(
          {
            id: existing.id,
            objectNames: assets.flatMap((asset) =>
              [asset.objectName, asset.thumbnailObjectName].filter(
                (name): name is string => Boolean(name),
              ),
            ),
          },
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.deleteCollection(event.payload, manager),
    );
    console.info(
      JSON.stringify({
        event: 'documents.collection_deleted',
        source: 'admin',
        actorId: command.actorId,
        collectionId: command.collectionId,
        assets: deletedAssets.map((asset) => ({
          assetId: asset.id,
          mimeType: asset.mimeType,
          byteSize: Number(asset.byteSize),
        })),
        result: 'success',
        cleanupStatus: 'queued',
      }),
    );
    return result;
  }
}

@CommandHandler(AddContentAssetCommand)
export class AddContentAssetHandler
  implements ICommandHandler<AddContentAssetCommand, ContentAssetEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  execute(command: AddContentAssetCommand): Promise<ContentAssetEntity> {
    if (!Number.isSafeInteger(command.byteSize) || command.byteSize < 0) {
      throw new BadRequestException('Asset byteSize must be non-negative.');
    }
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const collection = await this.repository.findCollection(
          command.collectionId,
          manager,
          true,
        );
        if (!collection) throw new NotFoundException('Collection not found.');
        const assets = await this.repository.listAssets(
          collection.id,
          manager,
          true,
        );
        return assetSavedEvent(
          {
            assetId: randomUUID(),
            collectionId: collection.id,
            objectName: command.objectName,
            thumbnailObjectName: command.thumbnailObjectName,
            originalName: command.originalName,
            mimeType: command.mimeType,
            byteSize: String(command.byteSize),
            title: normalizeOptional(command.title),
            caption: normalizeOptional(command.caption),
            position: assets.length,
            uploadedBy: command.actorId,
          },
          command.actorId,
          'media',
        );
      },
      (event, _stored, manager) =>
        this.projector.projectAsset(event.payload, manager),
    );
  }
}

@CommandHandler(UpdateContentAssetCommand)
export class UpdateContentAssetHandler
  implements ICommandHandler<UpdateContentAssetCommand, ContentAssetEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  execute(command: UpdateContentAssetCommand): Promise<ContentAssetEntity> {
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const asset = await this.repository.findAsset(
          command.assetId,
          manager,
          true,
        );
        if (!asset) throw new NotFoundException('Asset not found.');
        return assetSavedEvent(
          {
            assetId: asset.id,
            collectionId: asset.collectionId,
            objectName: asset.objectName,
            thumbnailObjectName: asset.thumbnailObjectName,
            originalName: asset.originalName,
            mimeType: asset.mimeType,
            byteSize: asset.byteSize,
            title:
              command.title === undefined
                ? asset.title
                : normalizeOptional(command.title),
            caption:
              command.caption === undefined
                ? asset.caption
                : normalizeOptional(command.caption),
            position: asset.position,
            uploadedBy: asset.uploadedBy,
          },
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.projectAsset(event.payload, manager),
    );
  }
}

@CommandHandler(ReorderContentAssetsCommand)
export class ReorderContentAssetsHandler
  implements ICommandHandler<ReorderContentAssetsCommand, ContentAssetEntity[]>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  execute(command: ReorderContentAssetsCommand): Promise<ContentAssetEntity[]> {
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const collection = await this.repository.findCollection(
          command.collectionId,
          manager,
          true,
        );
        if (!collection) throw new NotFoundException('Collection not found.');
        const assets = await this.repository.listAssets(
          collection.id,
          manager,
          true,
        );
        assertExactOrder(assets.map(({ id }) => id), command.assetIds);
        return assetsReorderedEvent(
          {
            scopeId: collection.id,
            positions: command.assetIds.map((id, position) => ({
              id,
              position,
            })),
          },
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.reorderAssets(event.payload, manager),
    );
  }
}

@CommandHandler(SetContentCollectionCoverCommand)
export class SetContentCollectionCoverHandler
  implements
    ICommandHandler<SetContentCollectionCoverCommand, ContentCollectionEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  execute(
    command: SetContentCollectionCoverCommand,
  ): Promise<ContentCollectionEntity> {
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const collection = await this.repository.findCollection(
          command.collectionId,
          manager,
          true,
        );
        if (!collection) throw new NotFoundException('Collection not found.');
        if (command.assetId && collection.kind !== 'photo_album') {
          throw new BadRequestException(
            'Only photo albums can have a cover asset.',
          );
        }
        if (command.assetId) {
          const asset = await this.repository.findAsset(
            command.assetId,
            manager,
            true,
          );
          if (!asset || asset.collectionId !== collection.id) {
            throw new BadRequestException(
              'Cover asset must belong to the target collection.',
            );
          }
        }
        return collectionSavedEvent(
          {
            collectionId: collection.id,
            name: collection.name,
            description: collection.description,
            kind: collection.kind,
            seasonKey: collection.seasonKey,
            position: collection.position,
            coverAssetId: command.assetId,
          },
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.projectCollection(event.payload, manager),
    );
  }
}

@CommandHandler(DeleteContentAssetCommand)
export class DeleteContentAssetHandler
  implements ICommandHandler<DeleteContentAssetCommand, string>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: DocumentsProjector,
    private readonly repository: DocumentsRepository,
  ) {}

  async execute(command: DeleteContentAssetCommand): Promise<string> {
    const deletionLog: {
      collectionId?: string;
      mimeType?: string;
      byteSize?: number;
    } = {};
    const result = await this.events.appendPreparedAndProject(
      async (manager) => {
        const asset = await this.repository.findAsset(
          command.assetId,
          manager,
          true,
        );
        if (!asset) throw new NotFoundException('Asset not found.');
        Object.assign(deletionLog, {
          collectionId: asset.collectionId,
          mimeType: asset.mimeType,
          byteSize: Number(asset.byteSize),
        });
        return assetDeletedEvent(
          {
            id: asset.id,
            objectNames: [asset.objectName, asset.thumbnailObjectName].filter(
              (name): name is string => Boolean(name),
            ),
          },
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.deleteAsset(event.payload, manager),
    );
    console.info(
      JSON.stringify({
        event: 'documents.asset_deleted',
        source: 'admin',
        actorId: command.actorId,
        assetId: command.assetId,
        ...deletionLog,
        result: 'success',
        cleanupStatus: 'queued',
      }),
    );
    return result;
  }
}

function validateSeason(seasonKey: number): void {
  try {
    assertSeasonKey(seasonKey);
  } catch (error) {
    throw new BadRequestException((error as Error).message);
  }
}

function normalizeOptional(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function assertExactOrder(existingIds: string[], requestedIds: string[]): void {
  const existing = new Set(existingIds);
  const requested = new Set(requestedIds);
  if (
    requested.size !== requestedIds.length ||
    existing.size !== requested.size ||
    [...existing].some((id) => !requested.has(id))
  ) {
    throw new BadRequestException(
      'Reorder must contain every item in exactly one collection group.',
    );
  }
}
