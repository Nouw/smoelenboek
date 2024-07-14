import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Committee } from '../entities/committee.entity';

@Injectable()
export class CommitteePipe implements PipeTransform {
  constructor(
    @InjectRepository(Committee)
    private readonly repository: Repository<Committee>,
  ) {}

  transform(value: any, metadata: ArgumentMetadata): Promise<Committee | null> {
    return this.repository.findOneBy({ id: value });
  }
}
