import type { CommitteeDto, CommitteeMembershipDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  toCommitteeDto,
  toCommitteeMembershipDto,
} from '../dto/committee-output';
import { CommitteesRepository } from '../repositories/committees.repository';
import {
  ListCommitteeMembershipsBySeasonQuery,
  ListCommitteesQuery,
} from './committee.queries';

@QueryHandler(ListCommitteesQuery)
export class ListCommitteesHandler
  implements IQueryHandler<ListCommitteesQuery, CommitteeDto[]>
{
  constructor(private readonly committeesRepository: CommitteesRepository) {}

  async execute(): Promise<CommitteeDto[]> {
    const committees = await this.committeesRepository.findAll();

    return committees.map(toCommitteeDto);
  }
}

@QueryHandler(ListCommitteeMembershipsBySeasonQuery)
export class ListCommitteeMembershipsBySeasonHandler
  implements
    IQueryHandler<
      ListCommitteeMembershipsBySeasonQuery,
      CommitteeMembershipDto[]
    >
{
  constructor(private readonly committeesRepository: CommitteesRepository) {}

  async execute(
    query: ListCommitteeMembershipsBySeasonQuery,
  ): Promise<CommitteeMembershipDto[]> {
    const memberships = await this.committeesRepository.findMembershipsBySeason(
      query.seasonKey,
    );

    return memberships.map(toCommitteeMembershipDto);
  }
}
