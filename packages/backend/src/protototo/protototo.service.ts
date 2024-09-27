import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProtototoSeasonDto } from './dto/create-protototo-season.dto';
import { ProtototoSeason } from './entities/protototo-season.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format } from 'date-fns';
import { CreateProtototoMatchDto } from './dto/create-protototo-match.dto';
import { ProtototoMatch } from './entities/protototo-match.entity';
import { NevoboService } from 'src/nevobo/nevobo.service';
import { TeamRank } from 'src/teams/enums/team-rank.enum';
import { ProtototoMatchResult } from './entities/protototo-result.entity';
import { ProtototoPrediction } from './entities/protototo-prediction.entity';
import * as exceljs from 'exceljs';
import { UpdateProtototoSeasonDto } from './dto/update-protototo-season.dto';

interface Column {
  header: string;
  key: string;
}

@Injectable()
export class ProtototoService {
  constructor(
    @InjectRepository(ProtototoSeason)
    private readonly protototoSeasonRepository: Repository<ProtototoSeason>,
    @InjectRepository(ProtototoMatch)
    private readonly protototoMatchRepository: Repository<ProtototoMatch>,
    @InjectRepository(ProtototoMatchResult)
    private readonly protototoMatchResultRepository: Repository<ProtototoMatchResult>,
    @InjectRepository(ProtototoPrediction)
    private readonly protototoPredictionRepository: Repository<ProtototoPrediction>,
    private nevoboService: NevoboService,
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
    console.log('Find all seasons!');
    return this.protototoSeasonRepository.find({ order: { id: 'ASC' } });
  }

  findOne(id: number) {
    return this.protototoSeasonRepository.findOneBy({ id });
  }

  async update(id: number, updateProtototoDto: UpdateProtototoSeasonDto) {
    const season = await this.protototoSeasonRepository.findOneByOrFail({ id });

    season.start = updateProtototoDto.start;
    season.end = updateProtototoDto.end;
    season.tikkie = updateProtototoDto.tikkie;

    return this.protototoSeasonRepository.save(season);
  }

  remove(id: number) {
    return `This action removes a #${id} protototo`;
  }

  async createMatch(createMatchDto: CreateProtototoMatchDto) {
    const homeTeam = await this.nevoboService.team(createMatchDto.homeTeam);
    const awayTeam = await this.nevoboService.team(createMatchDto.awayTeam);

    const exists = await this.protototoMatchRepository.findOneBy({
      nevoboId: createMatchDto.nevoboId,
      season: { id: createMatchDto.seasonId },
    });
    console.log(exists);
    if (exists) {
      throw new ConflictException('Already added to season');
    }

    const match = this.protototoMatchRepository.create();
    match.homeTeam = homeTeam.omschrijving;
    match.awayTeam = awayTeam.omschrijving;
    match.nevoboId = createMatchDto.nevoboId;
    match.season = await this.protototoSeasonRepository.findOneOrFail({
      where: { id: createMatchDto.seasonId },
    });
    match.rank = TeamRank.Eerstedivisie;

    return this.protototoMatchRepository.save(match);
  }

  getMatches(id: number) {
    return this.protototoMatchRepository.findBy({ season: { id } });
  }

  deleteMatch(id: number) {
    return this.protototoMatchRepository.delete(id);
  }

  async fetchMatchResult(id: number) {
    const protototoMatch = await this.protototoMatchRepository.findOneByOrFail({
      id,
    });

    const match = await this.nevoboService.getMatchResult(
      protototoMatch.nevoboId,
    );

    if (!match.setstanden) {
      throw new NotFoundException();
    }

    const result: ProtototoMatchResult = new ProtototoMatchResult();
    result.match = protototoMatch;

    const keys: Array<keyof ProtototoMatchResult> = [
      'setOne',
      'setTwo',
      'setThree',
      'setFour',
      'setFive',
    ];

    for (let i = 0; i < match.setstanden.length; i++) {
      const set = match.setstanden[i];
      let setResult: boolean;

      if (protototoMatch.homeTeam.includes('protos')) {
        setResult = set.puntenA > set.puntenB;
      } else {
        setResult = set.puntenA < set.puntenB;
      }

      // @ts-expect-error we know the type here??
      result[keys[i]] = setResult;
    }

    return this.protototoMatchResultRepository.upsert(result, ['match']);
  }

  async getParticipants(id: number) {
    const season = await this.protototoSeasonRepository.findOne({
      where: { id },
      relations: { matches: { predictions: { user: true }, result: true } },
    });

    if (!season) {
      throw new NotFoundException();
    }

    const rows: Map<string, number> = new Map();

    for (const match of season.matches) {
      for (const prediction of match.predictions) {
        const key = `${prediction.user.firstName} ${prediction.user.lastName}`;

        if (!rows.has(key)) {
          rows.set(key, 0);
        }

        let score = rows.get(key);

        score++;

        if (prediction.setOne === match.result.setOne) {
          score++;
        }
        if (prediction.setTwo === match.result.setTwo) {
          score++;
        }
        if (prediction.setThree === match.result.setThree) {
          score++;
        }
        if (prediction.setFour === match.result.setFour) {
          score++;
        }
        if (prediction.setFive === match.result.setFive) {
          score++;
        }

        rows.set(key, score);
      }
    }

    const columns: Column[] = [
      { header: 'Naam', key: 'name' },
      { header: 'Score', key: 'score' },
      { header: 'Email', key: 'email' },
    ];

    const workbook = new exceljs.Workbook();
    workbook.creator = 'Fabio Dijkshoorn';

    const worksheet = workbook.addWorksheet('Scores');
    worksheet.columns = columns;

    worksheet.addRows(
      Array.from(rows.entries()).map((row) => ({
        name: row[0],
        score: row[1],
      })),
    );

    const file = await workbook.xlsx.writeBuffer();

    return new Uint8Array(file);
  }
}
