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

  findByNameCaseInsensitive(name: string): Promise<TeamEntity | null> {
    return this.teamsRepository
      .createQueryBuilder('team')
      .where('LOWER(team.name) = LOWER(:name)', { name })
      .getOne();
  }

  findMembershipsBySeason(seasonKey: number): Promise<TeamMembershipEntity[]> {
    return this.membershipsRepository.find({
      where: { seasonKey, endedOn: IsNull() },
    });
  }

  findMembershipsByTeamAndSeason(
    teamId: string,
    seasonKey: number,
  ): Promise<TeamMembershipEntity[]> {
    return this.membershipsRepository.find({
      where: { teamId, seasonKey },
      order: { endedOn: 'ASC', startedOn: 'ASC', createdAt: 'ASC' },
    });
  }

  findMembershipById(id: string): Promise<TeamMembershipEntity | null> {
    return this.membershipsRepository.findOneBy({ id });
  }

  findActiveAssignment(
    userId: string,
    teamId: string,
    seasonKey: number,
    role: TeamMembershipEntity['role'],
  ): Promise<TeamMembershipEntity | null> {
    return this.membershipsRepository.findOneBy({
      userId,
      teamId,
      seasonKey,
      role,
      endedOn: IsNull(),
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
