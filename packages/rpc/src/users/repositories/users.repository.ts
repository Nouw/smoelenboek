import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';

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

  search(query: string, limit = 20): Promise<UserEntity[]> {
    const term = query.trim();
    const where = term
      ? [
          { name: ILike(`%${term}%`) },
          { firstName: ILike(`%${term}%`) },
          { lastName: ILike(`%${term}%`) },
          { email: ILike(`%${term}%`) },
        ]
      : undefined;

    return this.repository.find({
      where,
      order: { firstName: 'ASC', lastName: 'ASC', name: 'ASC' },
      take: limit,
    });
  }
}
