import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  findMembershipsBySeason(seasonId: string): Promise<TeamMembershipEntity[]> {
    return this.membershipsRepository.find({ where: { seasonId } });
  }

  findMembershipsByUser(userId: string): Promise<TeamMembershipEntity[]> {
    return this.membershipsRepository.find({ where: { userId } });
  }
}

