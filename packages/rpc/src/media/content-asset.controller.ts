import {
  Controller,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

import { AuthContextFactory } from '../auth/auth-context.factory';
import { AddContentAssetCommand } from '../documents/commands/document.commands';
import { toContentAssetOutput } from '../documents/dto/document-output';
import { ContentAssetEntity } from '../documents/entities/content-asset.entity';
import { DocumentsRepository } from '../documents/repositories/documents.repository';
import {
  type ImageUploadFile,
  MediaUploadCompensationError,
  MediaService,
  type StoredObject,
  type UploadedContentObjects,
} from './media.service';

@Controller('media/collections')
export class ContentAssetUploadController {
  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly commandBus: CommandBus,
    private readonly documentsRepository: DocumentsRepository,
    private readonly mediaService: MediaService,
  ) {}

  @Post(':collectionId/assets')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024, files: 1 },
    }),
  )
  async upload(
    @Req() request: Request,
    @Param('collectionId') collectionId: string,
    @UploadedFile() file: ImageUploadFile,
  ) {
    const actorId = await this.requireAdmin(request);
    const collection = await this.documentsRepository.findCollection(collectionId);

    if (!collection) throw new NotFoundException('Collection not found.');

    const objectAssetId = randomUUID();
    let uploaded: UploadedContentObjects;
    try {
      uploaded = await this.mediaService.uploadContentAsset(
        collection.kind,
        collection.id,
        objectAssetId,
        file,
      );
    } catch (error) {
      let cleanupStatus = 'not_required';
      if (error instanceof MediaUploadCompensationError) {
        cleanupStatus = await this.compensateObjectNames(
          error.orphanedObjectNames,
        );
      }
      this.logUpload('failed', {
        actorId,
        collectionId,
        objectAssetId,
        mimeType: file?.mimetype ?? null,
        byteSize: file?.size ?? null,
        cleanupStatus,
        error: errorMessage(error),
      });
      throw error;
    }

    try {
      const asset = await this.commandBus.execute<
        AddContentAssetCommand,
        ContentAssetEntity
      >(
        new AddContentAssetCommand(
          actorId,
          collection.id,
          uploaded.objectName,
          uploaded.thumbnailObjectName,
          file.originalname,
          uploaded.contentType,
          uploaded.sizeBytes,
        ),
      );
      console.info(
        JSON.stringify({
          event: 'documents.asset_uploaded',
          actorId,
          collectionId,
          assetId: asset.id,
          mimeType: asset.mimeType,
          byteSize: Number(asset.byteSize),
          result: 'success',
          cleanupStatus: 'not_required',
        }),
      );
      return toContentAssetOutput(asset);
    } catch (error) {
      const names = [uploaded.objectName, uploaded.thumbnailObjectName].filter(
        (name): name is string => Boolean(name),
      );
      const cleanupStatus = await this.compensateObjectNames(names);
      this.logUpload('failed', {
        actorId,
        collectionId,
        objectAssetId,
        mimeType: uploaded.contentType,
        byteSize: uploaded.sizeBytes,
        cleanupStatus,
        error: errorMessage(error),
      });
      throw error;
    }
  }

  private async compensateObjectNames(
    objectNames: string[],
  ): Promise<'completed' | 'queued'> {
    let pending = [...new Set(objectNames)];
    for (let attempt = 0; attempt < 3 && pending.length > 0; attempt += 1) {
      const results = await Promise.allSettled(
        pending.map((name) => this.mediaService.deleteObjectByName(name)),
      );
      pending = pending.filter(
        (_name, index) => results[index]?.status === 'rejected',
      );
    }
    if (pending.length > 0) {
      await this.documentsRepository.enqueueObjectCleanup(pending);
      return 'queued';
    }
    return 'completed';
  }

  private logUpload(
    result: 'failed',
    details: Record<string, unknown>,
  ): void {
    console.error(
      JSON.stringify({
        event: 'documents.asset_upload_failed',
        source: 'media',
        result,
        ...details,
      }),
    );
  }

  private async requireAdmin(request: Request): Promise<string> {
    const context = await this.authContextFactory.create(request);
    if (!context.userId) {
      throw new UnauthorizedException('Authentication is required.');
    }
    if (context.passwordMigrationRequired || context.role !== 'admin') {
      throw new ForbiddenException('Administrator access is required.');
    }
    return context.userId;
  }
}

@Controller('media/assets')
export class ContentAssetController {
  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly documentsRepository: DocumentsRepository,
    private readonly mediaService: MediaService,
  ) {}

  @Get(':assetId/content')
  @HttpCode(200)
  @Header('Cache-Control', 'private, max-age=86400, immutable')
  async content(
    @Req() request: Request,
    @Res() response: Response,
    @Param('assetId') assetId: string,
    @Query('download') download?: string,
  ): Promise<void> {
    await this.requireAuthenticated(request);
    const asset = await this.documentsRepository.findAsset(assetId);
    if (!asset) throw new NotFoundException('Asset not found.');
    const object = await this.mediaService.getObjectByName(asset.objectName);
    response.setHeader(
      'Content-Disposition',
      contentDisposition(asset.originalName, download === '1'),
    );
    await streamObject(request, response, object);
  }

  @Get(':assetId/thumbnail')
  @HttpCode(200)
  @Header('Cache-Control', 'private, max-age=86400, immutable')
  async thumbnail(
    @Req() request: Request,
    @Res() response: Response,
    @Param('assetId') assetId: string,
  ): Promise<void> {
    await this.requireAuthenticated(request);
    const asset = await this.documentsRepository.findAsset(assetId);
    if (!asset?.thumbnailObjectName) {
      throw new NotFoundException('Asset thumbnail not found.');
    }
    const object = await this.mediaService.getObjectByName(
      asset.thumbnailObjectName,
    );
    await streamObject(request, response, object);
  }

  private async requireAuthenticated(request: Request): Promise<void> {
    const context = await this.authContextFactory.create(request);
    if (!context.userId) {
      throw new UnauthorizedException('Authentication is required.');
    }
    if (context.passwordMigrationRequired) {
      throw new ForbiddenException(
        'A password reset is required before using the application.',
      );
    }
  }
}

async function streamObject(
  request: Request,
  response: Response,
  object: StoredObject,
): Promise<void> {
  if (object.etag && request.headers['if-none-match'] === object.etag) {
    response.status(304).end();
    return;
  }
  response.setHeader('Content-Type', object.contentType);
  response.setHeader('Cache-Control', 'private, max-age=86400, immutable');
  if (object.contentLength !== null) {
    response.setHeader('Content-Length', String(object.contentLength));
  }
  if (object.etag) response.setHeader('ETag', object.etag);
  await pipeline(object.content, response);
}

function contentDisposition(filename: string, download: boolean): string {
  const ascii = filename
    .replace(/[\r\n]/g, '')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_') || 'download';
  return `${download ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename.replace(/[\r\n]/g, ''))}`;
}

export const contentDispositionForTest = contentDisposition;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
