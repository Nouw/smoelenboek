import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Season } from './entities/season.entity';
import { Repository } from 'typeorm';
import { format } from 'date-fns';
import { NoCurrentSeasonException } from 'src/exceptions/season.exception';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SeasonService {
  private readonly logger = new Logger(SeasonService.name);

  constructor(
    @InjectRepository(Season)
    private readonly seasonsRepository: Repository<Season>,
  ) { }

  async getCurrentSeason(): Promise<Season> {
    const now = format(new Date(), 'yyyy-MM-dd');

    const season = this.seasonsRepository
      .createQueryBuilder('s')
      .where(`s.startDate <= '${now}' AND s.endDate > '${now}'`)
      .getOne();

    if (!season) {
      throw new NoCurrentSeasonException();
    }

    return season;
  }

  create(createSeasonDto: CreateSeasonDto) {
    const season = new Season();

    season.startDate = createSeasonDto.startDate;
    season.endDate = createSeasonDto.endDate;
    season.name = `${createSeasonDto.startDate.getFullYear()}-${createSeasonDto.endDate.getFullYear()}`;

    return this.seasonsRepository.save(season);
  }

  findAll() {
    return this.seasonsRepository.find({ order: { endDate: 'DESC' } });
  }

  findOne(id: number) {
    return this.seasonsRepository.findOneBy({ id });
  }

  async update(id: number, updateSeasonDto: UpdateSeasonDto) {
    const season = await this.seasonsRepository.findOneBy({ id });

    if (!season) {
      throw new NotFoundException();
    }

    season.startDate = updateSeasonDto.startDate;
    season.endDate = updateSeasonDto.endDate;
    season.name = `${updateSeasonDto.startDate.getFullYear()}-${updateSeasonDto.endDate.getFullYear()}`;

    return this.seasonsRepository.save(season);
  }

  remove(id: number) {
    return this.seasonsRepository.delete(id);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async updateCurrentSeason() {
    this.logger.log('Running update current season job');

    const season = await this.getCurrentSeason();

    if (!season) {
      return;
    }

    if (season.current) {
      return;
    }

    const prevSeason = await this.seasonsRepository.findOneBy({
      id: season.id - 1,
    });

    if (prevSeason) {
      prevSeason.current = false;
    }

    season.current = true;

    await this.seasonsRepository.save([season, prevSeason]);
  }

  overlap(date: Date, id?: string) {
    const query = this.seasonsRepository
      .createQueryBuilder('s')
      .where(':date BETWEEN s.startDate AND s.endDate', {
        date: format(date, 'dd-MM-yyyy'),
      });

    if (id !== undefined) {
      query.andWhere('s.id != :id', { id: +id });
    }

    return query.getMany();
  }
}
