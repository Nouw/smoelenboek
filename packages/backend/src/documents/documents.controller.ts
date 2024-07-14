import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Category } from 'src/categories/entities/category.entity';
import { CategoryPipe } from 'src/categories/pipes/category.pipe';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get(':id')
  findAll(@Param('id', CategoryPipe) category: Category) {
    return this.documentsService.findAll(category);
  }

  @Roles(Role.Admin)
  @Delete('')
  @HttpCode(HttpStatus.OK)
  remove(@Body('ids') ids: string[]) {
    return this.documentsService.remove(ids);
  }

  @Roles(Role.Admin)
  @Post('upload/:id')
  @UseInterceptors(FilesInterceptor('files'))
  uploadDocument(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('id', CategoryPipe) category: Category,
  ) {
    return this.documentsService.uploadFiles(files, category);
  }
}
