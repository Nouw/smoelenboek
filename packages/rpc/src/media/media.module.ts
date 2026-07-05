import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MediaService } from './media.service';
import { ImageController, ProfileImageController } from './profile-image.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ImageController, ProfileImageController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
