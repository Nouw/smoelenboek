import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SeasonEntity } from '../entities/season.entity';

@Injectable()
export class SeasonsRepository {
  constructor(
    @InjectRepository(SeasonEntity)
    private readonly repository: Repository<SeasonEntity>,
  ) {}

  findAll(): Promise<SeasonEntity[]> {
    return this.repository.find({ order: { startsAt: 'DESC' } });
  }

  findById(id: string): Promise<SeasonEntity | null> {
    return this.repository.findOneBy({ id });
  }

  findByName(name: string): Promise<SeasonEntity | null> {
    return this.repository.findOneBy({ name });
  }

  findCurrent(at: Date): Promise<SeasonEntity | null> {
    return this.repository
      .createQueryBuilder('season')
      .where('season.startsAt <= :at', { at })
      .andWhere('season.endsAt >= :at', { at })
      .orderBy('season.startsAt', 'DESC')
      .getOne();
  }
}

