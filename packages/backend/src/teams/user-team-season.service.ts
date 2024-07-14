import { Injectable, NotFoundException } from '@nestjs/common';
import { SeasonService } from 'src/season/season.service';
import { User } from 'src/users/entities/user.entity';
import { Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTeamSeason } from './entities/user-team-season.entity';
import { TeamFunction } from './enums/team-rank.enum';

@Injectable()
export class UserTeamSeasonService {
  constructor(
    private readonly seasonService: SeasonService,
    @InjectRepository(UserTeamSeason)
    private readonly userTeamSeasonsRepository: Repository<UserTeamSeason>,
  ) {}

  async addUserToTeam(user: User, team: Team) {
    const currSeason = await this.seasonService.getCurrentSeason();

    const userTeamSeason = new UserTeamSeason();
    userTeamSeason.team = team;
    userTeamSeason.user = user;
    userTeamSeason.season = currSeason;
    userTeamSeason['function'] = TeamFunction.OppositeHitter;

    return this.userTeamSeasonsRepository.save(userTeamSeason);
  }

  async updateUserToTeam(user: User, team: Team, func: TeamFunction) {
    const season = await this.seasonService.getCurrentSeason();

    const current = await this.userTeamSeasonsRepository.findOneBy({
      team,
      user,
      season,
    });

    if (!current) {
      throw new NotFoundException();
    }

    current.function = func;

    return this.userTeamSeasonsRepository.save(current);
  }

  async removeUserToTeam(user: User, team: Team) {
    const season = await this.seasonService.getCurrentSeason();

    const current = await this.userTeamSeasonsRepository.findOneBy({
      user,
      team,
      season,
    });

    return this.userTeamSeasonsRepository.delete(current);
  }
}
