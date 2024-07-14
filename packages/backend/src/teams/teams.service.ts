import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Repository } from 'typeorm';
import { SeasonService } from 'src/season/season.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamsRepository: Repository<Team>,
    private readonly seasonsService: SeasonService,
  ) {}

  create(createTeamDto: CreateTeamDto): Promise<Team> {
    const team = new Team(
      createTeamDto.name,
      createTeamDto.league,
      createTeamDto.gender,
    );

    return this.teamsRepository.save(team);
  }

  findAll(): Promise<Team[]> {
    return this.teamsRepository.find();
  }

  async findOne(id: number) {
    const season = await this.seasonsService.getCurrentSeason();

    return this.teamsRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect(
        't.userTeamSeason',
        'uts',
        'uts.teamId = t.id AND uts.seasonId = :seasonId',
        { seasonId: season.id },
      )
      .leftJoinAndSelect('uts.user', 'u')
      .select(['t', 'u.firstName', 'u.lastName', 'u.id', 'uts.function'])
      .where('t.id = :teamId', { teamId: id })
      .getOne();
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    const team = await this.teamsRepository.findOne({ where: { id } });

    if (!team) {
      throw new NotFoundException();
    }

    team.name = updateTeamDto.name;
    team.league = updateTeamDto.league;
    team.gender = updateTeamDto.gender;

    this.teamsRepository.save(team);

    return;
  }

  async remove(id: number) {
    const team = await this.teamsRepository.findOneBy({ id });

    if (!team) {
      throw new NotFoundException();
    }

    return this.teamsRepository.remove(team);
  }
}
