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

  search(query: string, limit = 20): Promise<UserEntity[]> {
    const term = query.trim();
    const users = this.repository.createQueryBuilder('user')
      .leftJoin('user_information', 'information', 'information."userId" = user.id')
      .where('information."leaveDate" IS NULL')
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .addOrderBy('user.name', 'ASC')
      .take(limit);
    if (term) {
      users.andWhere('(user.name ILIKE :term OR user."firstName" ILIKE :term OR user."lastName" ILIKE :term OR user.email ILIKE :term)', { term: `%${term}%` });
    }
    return users.getMany();
  }
}
