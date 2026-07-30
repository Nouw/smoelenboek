import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventStoreModule } from '../event-store/event-store.module';
import {
  AddContentAssetHandler,
  CreateContentCollectionHandler,
  DeleteContentAssetHandler,
  DeleteContentCollectionHandler,
  ReorderContentAssetsHandler,
  ReorderContentCollectionsHandler,
  SetContentCollectionCoverHandler,
  UpdateContentAssetHandler,
  UpdateContentCollectionHandler,
} from './commands/document.handlers';
import { ContentAssetEntity } from './entities/content-asset.entity';
import { ContentCollectionEntity } from './entities/content-collection.entity';
import { ContentObjectCleanupEntity } from './entities/content-object-cleanup.entity';
import { DocumentsProjector } from './projectors/documents.projector';
import {
  GetContentCollectionHandler,
  ListContentCollectionsHandler,
} from './queries/document.handlers';
import { DocumentsRepository } from './repositories/documents.repository';

@Module({
  imports: [
    EventStoreModule,
    TypeOrmModule.forFeature([
      ContentCollectionEntity,
      ContentAssetEntity,
      ContentObjectCleanupEntity,
    ]),
  ],
  providers: [
    DocumentsRepository,
    DocumentsProjector,
    CreateContentCollectionHandler,
    UpdateContentCollectionHandler,
    ReorderContentCollectionsHandler,
    DeleteContentCollectionHandler,
    AddContentAssetHandler,
    UpdateContentAssetHandler,
    ReorderContentAssetsHandler,
    SetContentCollectionCoverHandler,
    DeleteContentAssetHandler,
    ListContentCollectionsHandler,
    GetContentCollectionHandler,
  ],
  exports: [DocumentsRepository],
})
export class DocumentsModule {}
