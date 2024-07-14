import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Document } from './entities/document.entity';
import { OracleModule } from 'src/oracle/oracle.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Document]), OracleModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
