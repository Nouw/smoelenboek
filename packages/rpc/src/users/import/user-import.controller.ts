import { BadRequestException, Body, Controller, ForbiddenException, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { AuthContext } from '../../auth/auth-context';
import { AuthContextFactory } from '../../auth/auth-context.factory';
import type { ImportMapping } from './user-import.service';
import { UserImportService } from './user-import.service';

@Controller('users/admin/import')
export class UserImportController {
  constructor(private readonly imports: UserImportService, private readonly auth: AuthContextFactory) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async preview(@Req() request: Request, @UploadedFile() file: WorkbookUpload, @Body() body: Record<string, string>) {
    await this.requireAdmin(request);
    assertXlsx(file);
    return this.imports.preview(file.buffer, body.sheetName, Number(body.headerRow || 1), parseMapping(body.mapping));
  }

  @Post('execute')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async execute(@Req() request: Request, @UploadedFile() file: WorkbookUpload, @Body() body: Record<string, string>) {
    const session = await this.requireAdmin(request);
    assertXlsx(file);
    if (!body.fileHash || !body.sheetName || !body.mapping) throw new BadRequestException('fileHash, sheetName, and mapping are required.');
    return this.imports.execute(file.buffer, body.fileHash, body.sheetName, Number(body.headerRow || 1), parseMapping(body.mapping)!, session.userId!);
  }

  private async requireAdmin(request: Request): Promise<AuthContext> {
    const context = await this.auth.create(request);
    if (!context.userId || context.role !== 'admin') throw new ForbiddenException('Administrator access required.');
    return context;
  }
}

type WorkbookUpload = { originalname: string; mimetype: string; size: number; buffer: Buffer };
function assertXlsx(file?: WorkbookUpload): asserts file is WorkbookUpload {
  if (!file || !file.originalname.toLowerCase().endsWith('.xlsx') || file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b) throw new BadRequestException('A valid .xlsx workbook is required.');
}
function parseMapping(value?: string): ImportMapping | undefined {
  if (!value) return undefined;
  try { return JSON.parse(value) as ImportMapping; } catch { throw new BadRequestException('mapping must be valid JSON.'); }
}
