import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import { CommitteeEntity } from '../entities/committee.entity';

@Injectable()
export class CommitteesRepository {
  constructor(
    @InjectRepository(CommitteeEntity)
    private readonly committeesRepository: Repository<CommitteeEntity>,
    @InjectRepository(CommitteeMembershipEntity)
    private readonly membershipsRepository: Repository<CommitteeMembershipEntity>,
  ) {}

  findAll(): Promise<CommitteeEntity[]> {
    return this.committeesRepository.find({ order: { name: 'ASC' } });
  }

  findById(id: string): Promise<CommitteeEntity | null> {
    return this.committeesRepository.findOneBy({ id });
  }

  findMembershipsBySeason(
    seasonId: string,
  ): Promise<CommitteeMembershipEntity[]> {
    return this.membershipsRepository.find({ where: { seasonId } });
  }

  findMembershipsByUser(userId: string): Promise<CommitteeMembershipEntity[]> {
    return this.membershipsRepository.find({ where: { userId } });
  }
}

