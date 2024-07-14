import { Injectable } from '@nestjs/common';
import { Category } from 'src/categories/entities/category.entity';
import { createHash } from 'crypto';
import { OracleService } from 'src/oracle/oracle.service';
import { CategoryType } from 'src/categories/enums/catagory-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly oracleService: OracleService,
  ) { }

  async findAll(category: Category) {
    const documents = await this.documentsRepository.findBy({
      category: { id: category.id },
    });

    return { category, documents };
  }

  async remove(ids: string[]) {
    for (const id of ids) {
      const doc = await this.documentsRepository.findOneBy({ id: +id });

      return this.documentsRepository.remove(doc);
    }

    return;
  }

  async uploadFiles(files: Express.Multer.File[], category: Category) {
    const entities: Document[] = [];

    for (const file of files) {
      const folder = createHash('md5').update(category.name).digest('hex');

      const filename = await this.oracleService.upload(
        file,
        folder,
        category.type === CategoryType.Documents,
      );

      const doc = this.documentsRepository.create();
      doc.category = category;
      doc.path = `${folder}/${filename}`;
      doc.originalName = file.originalname;

      entities.push(doc);
    }

    return this.documentsRepository.save(entities);
  }
}
