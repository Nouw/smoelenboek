import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';

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
    seasonKey: number,
  ): Promise<CommitteeMembershipEntity[]> {
    return this.membershipsRepository.find({
      where: { seasonKey, endedOn: IsNull() },
    });
  }

  findActiveMembershipsByCommitteeAndSeason(
    committeeId: string,
    seasonKey: number,
    activeOn: string,
  ): Promise<CommitteeMembershipEntity[]> {
    return this.membershipsRepository.find({
      where: {
        committeeId,
        seasonKey,
        startedOn: LessThanOrEqual(activeOn),
        endedOn: IsNull(),
      },
    });
  }

  findMembershipById(id: string): Promise<CommitteeMembershipEntity | null> {
    return this.membershipsRepository.findOneBy({ id });
  }

  findMembershipsByUser(userId: string): Promise<CommitteeMembershipEntity[]> {
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
