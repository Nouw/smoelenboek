import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';
import { UsersModule } from '../users/users.module';
import {
  DeleteProfileImageHandler,
  UploadProfileImageHandler,
} from './commands/profile-image.handlers';
import { MediaService } from './media.service';
import {
  ContentAssetController,
  ContentAssetUploadController,
} from './content-asset.controller';
import { ContentObjectCleanupProcessor } from './content-object-cleanup.processor';
import { ObjectController, ProfileImageController } from './profile-image.controller';
import { GetObjectHandler } from './queries/get-object.handler';

@Module({
  imports: [AuthModule, DocumentsModule, UsersModule],
  controllers: [
    ContentAssetController,
    ContentAssetUploadController,
    ObjectController,
    ProfileImageController,
  ],
  providers: [
    MediaService,
    GetObjectHandler,
    UploadProfileImageHandler,
    DeleteProfileImageHandler,
    ContentObjectCleanupProcessor,
  ],
  exports: [MediaService],
})
export class MediaModule {}
