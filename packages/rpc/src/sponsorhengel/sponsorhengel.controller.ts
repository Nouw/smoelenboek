import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

import { AuthContextFactory } from '../auth/auth-context.factory';
import { type ImageUploadFile, MediaService } from '../media/media.service';
import { SponsorhengelRepository } from './repositories/sponsorhengel.repository';

@Controller('media/sponsorhengel')
export class SponsorhengelController {
  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly mediaService: MediaService,
    private readonly repository: SponsorhengelRepository,
  ) {}

  @Get('content')
  @HttpCode(200)
  async content(@Req() request: Request, @Res() response: Response): Promise<void> {
    await this.requireAuthenticated(request);
    const row = await this.repository.find();
    if (!row) throw new NotFoundException('No sponsorhengel PDF has been uploaded yet.');
    const object = await this.mediaService.getObjectByName(row.objectName);

    if (object.etag && request.headers['if-none-match'] === object.etag) {
      response.status(304).end();
      return;
    }
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${row.originalName.replace(/["\r\n]/g, '_')}"`,
    );
    if (object.contentLength !== null) {
      response.setHeader('Content-Length', String(object.contentLength));
    }
    if (object.etag) response.setHeader('ETag', object.etag);
    await pipeline(object.content, response);
  }

  @Put()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  async replace(
    @Req() request: Request,
    @UploadedFile() file: ImageUploadFile,
  ): Promise<{ originalName: string; byteSize: number; updatedAt: string }> {
    const actorId = await this.requireAdmin(request);
    const objectName = `sponsorhengel/${randomUUID()}.pdf`;
    const { sizeBytes } = await this.mediaService.uploadPdfObject(objectName, file);
    const oldObjectName = await this.repository.upsert({
      objectName,
      originalName: file.originalname,
      mimeType: 'application/pdf',
      byteSize: sizeBytes,
    });
    if (oldObjectName) {
      this.mediaService.deleteObjectByName(oldObjectName).catch((err: unknown) => {
        console.error(JSON.stringify({
          event: 'sponsorhengel.old_object_cleanup_failed',
          actorId,
          objectName: oldObjectName,
          error: err instanceof Error ? err.message : String(err),
        }));
      });
    }
    console.info(JSON.stringify({
      event: 'sponsorhengel.replaced',
      actorId,
      objectName,
      originalName: file.originalname,
      byteSize: sizeBytes,
    }));
    const row = await this.repository.find();
    return {
      originalName: row!.originalName,
      byteSize: row!.byteSize,
      updatedAt: row!.updatedAt.toISOString(),
    };
  }

  private async requireAdmin(request: Request): Promise<string> {
    const context = await this.authContextFactory.create(request);
    if (!context.userId) throw new UnauthorizedException('Authentication is required.');
    if (context.passwordMigrationRequired || context.role !== 'admin') {
      throw new ForbiddenException('Administrator access is required.');
    }
    return context.userId;
  }

  private async requireAuthenticated(request: Request): Promise<void> {
    const context = await this.authContextFactory.create(request);
    if (!context.userId) throw new UnauthorizedException('Authentication is required.');
    if (context.passwordMigrationRequired) {
      throw new ForbiddenException('A password reset is required before using the application.');
    }
  }
}
