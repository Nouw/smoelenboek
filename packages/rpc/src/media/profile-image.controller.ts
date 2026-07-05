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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';

import { AuthContextFactory } from '../auth/auth-context.factory';
import {
  DeleteProfileImageCommand,
  UploadProfileImageCommand,
} from './commands/profile-image.commands';
import { type ImageUploadFile, type StoredObject } from './media.service';
import { GetObjectQuery } from './queries/get-object.query';

type ProfileImageResponse = {
  imageUrl: string | null;
};

@Controller('media/profile-image')
export class ProfileImageController {
  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly commandBus: CommandBus,
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

    return this.commandBus.execute(new UploadProfileImageCommand(userId, file));
  }

  @Delete()
  async deleteProfileImage(
    @Req() request: Request,
  ): Promise<ProfileImageResponse> {
    const userId = await this.requireUserId(request);

    return this.commandBus.execute(new DeleteProfileImageCommand(userId));
  }

  private async requireUserId(request: Request): Promise<string> {
    const context = await this.authContextFactory.create(request);

    if (!context.userId) {
      throw new UnauthorizedException('Authentication is required.');
    }

    return context.userId;
  }
}

@Controller(['media/objects', 'media/images'])
export class ObjectController {
  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('*objectName')
  @HttpCode(200)
  @Header('Cache-Control', 'private, max-age=86400, immutable')
  async getObject(
    @Req() request: Request,
    @Res() response: Response,
    @Param('objectName') objectNameParam: string | string[],
  ): Promise<void> {
    await this.requireAuthenticated(request);

    const objectName = Array.isArray(objectNameParam)
      ? objectNameParam.join('/')
      : objectNameParam;
    const object = await this.queryBus.execute<GetObjectQuery, StoredObject>(
      new GetObjectQuery(objectName),
    );
    const requestEtag = request.headers['if-none-match'];

    if (object.etag && requestEtag === object.etag) {
      response.status(304).end();
      return;
    }

    response.setHeader('Content-Type', object.contentType);
    response.setHeader('Cache-Control', 'private, max-age=86400, immutable');

    if (object.contentLength !== null) {
      response.setHeader('Content-Length', String(object.contentLength));
    }

    if (object.etag) {
      response.setHeader('ETag', object.etag);
    }

    await pipeline(object.content, response);
  }

  private async requireAuthenticated(request: Request): Promise<void> {
    const context = await this.authContextFactory.create(request);

    if (!context.userId) {
      throw new UnauthorizedException('Authentication is required.');
    }
  }
}
