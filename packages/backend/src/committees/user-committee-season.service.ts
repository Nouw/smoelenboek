import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeasonService } from 'src/season/season.service';
import { UserCommitteeSeason } from './entities/user-committee-season.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Committee } from './entities/committee.entity';
import { CommitteeFunction } from './enums/committee-function.enum';

@Injectable()
export class UserCommitteeSeasonService {
  constructor(
    private readonly seasonService: SeasonService,
    @InjectRepository(UserCommitteeSeason)
    private readonly userCommitteeSeasonsRepository: Repository<UserCommitteeSeason>,
  ) {}

  async addUserToCommittee(user: User, committee: Committee) {
    const currSeason = await this.seasonService.getCurrentSeason();

    const userTeamSeason = new UserCommitteeSeason();
    userTeamSeason.committee = committee;
    userTeamSeason.user = user;
    userTeamSeason.season = currSeason;

    return this.userCommitteeSeasonsRepository.save(userTeamSeason);
  }

  async updateUserToCommittee(
    user: User,
    committee: Committee,
    func: CommitteeFunction,
  ) {
    const season = await this.seasonService.getCurrentSeason();

    const current = await this.userCommitteeSeasonsRepository.findOneBy({
      committee,
      user,
      season,
    });

    if (!current) {
      throw new NotFoundException();
    }

    current.function = func;

    return this.userCommitteeSeasonsRepository.save(current);
  }

  async removeUserToCommittee(user: User, committee: Committee) {
    const season = await this.seasonService.getCurrentSeason();

    const current = await this.userCommitteeSeasonsRepository.findOneBy({
      user,
      committee,
      season,
    });

    return this.userCommitteeSeasonsRepository.delete(current);
  }
}
