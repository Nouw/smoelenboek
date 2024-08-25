import { Injectable } from '@nestjs/common';
import { CreateProtototoDto } from './dto/create-protototo.dto';
import { UpdateProtototoDto } from './dto/update-protototo.dto';
import { CreateProtototoSeasonDto } from './dto/create-protototo-season.dto';
import { ProtototoSeason } from './entities/protototo-season.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format } from 'date-fns';

@Injectable()
export class ProtototoService {
  constructor(
    @InjectRepository(ProtototoSeason)
    private readonly protototoSeasonRepository: Repository<ProtototoSeason>,
  ) {}

  createSeason(createSeasonDto: CreateProtototoSeasonDto) {
    const entity = createSeasonDto as ProtototoSeason;

    return this.protototoSeasonRepository.save(entity);
  }

  overlap(date: Date, id?: string) {
    const query = this.protototoSeasonRepository
      .createQueryBuilder('s')
      .where(':date BETWEEN s.startDate AND s.endDate', {
        date: format(date, 'dd-MM-yyyy'),
      });

    if (id !== undefined) {
      query.andWhere('s.id != :id', { id: +id });
    }

    return query.getMany();
  }

  findAllSeasons() {
    return this.protototoSeasonRepository.find({ order: { id: 'ASC' } });
  }

  findOne(id: number) {
    return `This action returns a #${id} protototo`;
  }

  update(id: number, updateProtototoDto: UpdateProtototoDto) {
    return `This action updates a #${id} protototo`;
  }

  remove(id: number) {
    return `This action removes a #${id} protototo`;
  }
}
