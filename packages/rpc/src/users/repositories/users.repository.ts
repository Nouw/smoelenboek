import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  findById(id: string): Promise<UserEntity | null> {
    return this.repository.findOneBy({ id });
  }

  findByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.repository.findBy({ id: In(ids) });
  }
}
