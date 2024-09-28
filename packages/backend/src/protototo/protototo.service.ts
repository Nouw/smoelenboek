import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProtototoSeasonDto } from './dto/create-protototo-season.dto';
import { ProtototoSeason } from './entities/protototo-season.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Raw,
  Repository,
} from 'typeorm';
import { format } from 'date-fns';
import { CreateProtototoMatchDto } from './dto/create-protototo-match.dto';
import { ProtototoMatch } from './entities/protototo-match.entity';
import { NevoboService } from 'src/nevobo/nevobo.service';
import { TeamRank } from 'src/teams/enums/team-rank.enum';
import { ProtototoMatchResult } from './entities/protototo-result.entity';
import { ProtototoPrediction } from './entities/protototo-prediction.entity';
import * as exceljs from 'exceljs';
import { UpdateProtototoSeasonDto } from './dto/update-protototo-season.dto';
import { ProtototoPredictionDto } from './dto/protototo-prediction.dto';
import { User } from '../users/entities/user.entity';
import { ProtototoPredictionExternal } from './entities/protototo-prediction-external.entity';

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
    @InjectRepository(ProtototoPredictionExternal)
    private readonly protototoPredictionExternalRepository: Repository<ProtototoPredictionExternal>,
    private nevoboService: NevoboService,
  ) {}

  createSeason(createSeasonDto: CreateProtototoSeasonDto) {
    const entity = createSeasonDto as ProtototoSeason;

    return this.protototoSeasonRepository.save(entity);
  }

  overlap(date: Date, id?: string) {
    const query = this.protototoSeasonRepository
      .createQueryBuilder('s')
      .where(':date BETWEEN s.start AND s.end', {
        date: format(date, 'hh:mm dd-MM-yyyy'),
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
      relations: {
        matches: {
          predictions: { user: true },
          externalPredictions: true,
          result: true,
        },
      },
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

        score += this.getScore(prediction, match);

        rows.set(key, score);
      }

      for (const prediction of match.externalPredictions) {
        const key = `${prediction.firstName} ${prediction.lastName} (${prediction.email})`;

        if (!rows.has(key)) {
          rows.set(key, 0);
        }

        let score = rows.get(key);

        score += this.getScore(prediction, match);

        rows.set(key, score);
      }
    }

    const columns: Column[] = [
      { header: 'Naam', key: 'name' },
      { header: 'Score', key: 'score' },
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

  private getScore(
    prediction: ProtototoPredictionExternal | ProtototoPrediction,
    match: ProtototoMatch,
  ): number {
    if (!match.result) {
      return 0;
    }

    let score = 1;

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

    return score;
  }

  async getCurrentSeason(user?: User) {
    const season = await this.protototoSeasonRepository.findOne({
      where: {
        start: Raw((alias) => `CURDATE() BETWEEN ${alias} AND end`),
      },
      relations: {
        matches: {
          predictions: false,
        },
      },
    });

    for (let key = 0; key < season.matches.length; key++) {
      season.matches[key].predictions = [];
      const match = season.matches[key];
      const prediction = await this.protototoPredictionRepository.findOne({
        where: { match, user: { id: user?.id ?? -1 } },
      });

      if (prediction) {
        season.matches[key].predictions = [prediction];
      }
    }

    return season;
  }

  async saveBet(id: number, bet: ProtototoPredictionDto, user: User) {
    const prediction = bet.email
      ? await this.getExternalBet(id, bet)
      : await this.getUserBet(id, user);

    prediction.match = await this.protototoMatchRepository.findOneByOrFail({
      id,
    });

    prediction.setOne = bet.setOne;
    prediction.setTwo = bet.setTwo;
    prediction.setThree = bet.setThree;
    prediction.setFour = bet.setFour;
    prediction.setFive = bet.setFive;

    if (bet.email) {
      return this.protototoPredictionExternalRepository.save(prediction);
    }

    return this.protototoPredictionRepository.save(prediction);
  }

  private async getExternalBet(
    id: number,
    bet: ProtototoPredictionDto,
  ): Promise<ProtototoPredictionExternal> {
    let prediction = await this.protototoPredictionExternalRepository.findOneBy(
      {
        email: bet.email,
        match: { id },
      },
    );

    if (!prediction) {
      prediction = new ProtototoPredictionExternal();
      prediction.email = bet.email;
    }

    prediction.firstName = bet.firstName;
    prediction.lastName = bet.lastName;

    return prediction;
  }

  private async getUserBet(
    id: number,
    user: User,
  ): Promise<ProtototoPrediction> {
    let prediction = await this.protototoPredictionRepository.findOneBy({
      user: { id: user.id },
      match: { id },
    });

    if (!prediction) {
      prediction = new ProtototoPrediction();
      prediction.user = user;
    }

    return prediction;
  }
}
