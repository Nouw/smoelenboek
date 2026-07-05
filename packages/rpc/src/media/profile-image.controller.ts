import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Post,
  Param,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';

import { AuthContextFactory } from '../auth/auth-context.factory';
import { UpdateUserProfileCommand } from '../users/commands/update-user-profile.command';
import { UsersRepository } from '../users/repositories/users.repository';
import { type ImageUploadFile, MediaService } from './media.service';

type ProfileImageResponse = {
  imageUrl: string | null;
};

@Controller('media/profile-image')
export class ProfileImageController {
  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly commandBus: CommandBus,
    private readonly mediaService: MediaService,
    private readonly usersRepository: UsersRepository,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async uploadProfileImage(
    @Req() request: Request,
    @UploadedFile() file: ImageUploadFile,
  ): Promise<ProfileImageResponse> {
    const userId = await this.requireUserId(request);
    const currentUser = await this.usersRepository.findById(userId);
    const previousImageUrl = currentUser?.imageUrl ?? null;
    const uploadedImage = await this.mediaService.uploadImage(
      'profile-images',
      userId,
      file,
    );

    try {
      await this.commandBus.execute(
        new UpdateUserProfileCommand(userId, {
          imageUrl: uploadedImage.imageUrl,
        }),
      );
    } catch (error) {
      await this.mediaService.deleteImageByUrl(uploadedImage.imageUrl);
      throw error;
    }

    await this.deletePreviousImage(previousImageUrl);

    return { imageUrl: uploadedImage.imageUrl };
  }

  @Delete()
  async deleteProfileImage(
    @Req() request: Request,
  ): Promise<ProfileImageResponse> {
    const userId = await this.requireUserId(request);
    const currentUser = await this.usersRepository.findById(userId);
    const previousImageUrl = currentUser?.imageUrl ?? null;

    await this.commandBus.execute(
      new UpdateUserProfileCommand(userId, { imageUrl: null }),
    );
    await this.deletePreviousImage(previousImageUrl);

    return { imageUrl: null };
  }

  private async requireUserId(request: Request): Promise<string> {
    const context = await this.authContextFactory.create(request);

    if (!context.userId) {
      throw new UnauthorizedException('Authentication is required.');
    }

    return context.userId;
  }

  private async deletePreviousImage(imageUrl: string | null): Promise<void> {
    try {
      await this.mediaService.deleteImageByUrl(imageUrl);
    } catch (error) {
      console.warn(
        `[media] Failed to delete previous profile image: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

@Controller('media/images')
export class ImageController {
  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly mediaService: MediaService,
  ) {}

  @Get('*objectName')
  @HttpCode(200)
  @Header('Cache-Control', 'private, max-age=86400, immutable')
  async getImage(
    @Req() request: Request,
    @Res() response: Response,
    @Param('objectName') objectNameParam: string | string[],
  ): Promise<void> {
    await this.requireAuthenticated(request);

    const objectName = Array.isArray(objectNameParam)
      ? objectNameParam.join('/')
      : objectNameParam;
    const image = await this.mediaService.getImageByObjectName(objectName);
    const requestEtag = request.headers['if-none-match'];

    if (image.etag && requestEtag === image.etag) {
      response.status(304).end();
      return;
    }

    response.setHeader('Content-Type', image.contentType);
    response.setHeader('Cache-Control', 'private, max-age=86400, immutable');

    if (image.contentLength !== null) {
      response.setHeader('Content-Length', String(image.contentLength));
    }

    if (image.etag) {
      response.setHeader('ETag', image.etag);
    }

    await pipeline(image.content, response);
  }

  private async requireAuthenticated(request: Request): Promise<void> {
    const context = await this.authContextFactory.create(request);

    if (!context.userId) {
      throw new UnauthorizedException('Authentication is required.');
    }
  }
}
