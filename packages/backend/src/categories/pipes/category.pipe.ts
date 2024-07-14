import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryPipe implements PipeTransform {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  transform(value: any, metadata: ArgumentMetadata): Promise<Category | null> {
    return this.repository.findOneBy({ id: value });
  }
}
