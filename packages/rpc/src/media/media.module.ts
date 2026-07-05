import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import {
  DeleteProfileImageHandler,
  UploadProfileImageHandler,
} from './commands/profile-image.handlers';
import { MediaService } from './media.service';
import { ObjectController, ProfileImageController } from './profile-image.controller';
import { GetObjectHandler } from './queries/get-object.handler';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ObjectController, ProfileImageController],
  providers: [
    MediaService,
    GetObjectHandler,
    UploadProfileImageHandler,
    DeleteProfileImageHandler,
  ],
  exports: [MediaService],
})
export class MediaModule {}
