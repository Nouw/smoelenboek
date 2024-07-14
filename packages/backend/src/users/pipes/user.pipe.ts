import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserPipe implements PipeTransform {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
  ) {}

  transform(value: any, metadata: ArgumentMetadata): Promise<User | null> {
    return this.repository.findOneBy({ id: value });
  }
}
