import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';

import { TeamMembershipEntity } from '../entities/team-membership.entity';
import { TeamEntity } from '../entities/team.entity';

@Injectable()
export class TeamsRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(TeamMembershipEntity)
    private readonly membershipsRepository: Repository<TeamMembershipEntity>,
  ) {}

  findAll(): Promise<TeamEntity[]> {
    return this.teamsRepository.find({ order: { name: 'ASC' } });
  }

  findById(id: string): Promise<TeamEntity | null> {
    return this.teamsRepository.findOneBy({ id });
  }

  findMembershipsBySeason(seasonKey: number): Promise<TeamMembershipEntity[]> {
    return this.membershipsRepository.find({
      where: { seasonKey, endedOn: IsNull() },
    });
  }

  findActiveMembershipsByTeamAndSeason(
    teamId: string,
    seasonKey: number,
    activeOn: string,
  ): Promise<TeamMembershipEntity[]> {
    return this.membershipsRepository.find({
      where: {
        teamId,
        seasonKey,
        startedOn: LessThanOrEqual(activeOn),
        endedOn: IsNull(),
      },
    });
  }

  findMembershipsByUser(userId: string): Promise<TeamMembershipEntity[]> {
    return this.membershipsRepository.find({ where: { userId } });
  }

  async findSeasonKeys(): Promise<number[]> {
    const rows = await this.membershipsRepository
      .createQueryBuilder('membership')
      .select('DISTINCT membership.seasonKey', 'seasonKey')
      .getRawMany<{ seasonKey: number | string }>();

    return rows.map(({ seasonKey }) => Number(seasonKey));
  }
}
