import type {
  CommitteeDto,
  CommitteeMembershipDto,
  CommitteeRosterMemberDto,
  CurrentCommitteeRosterDto,
} from '@repo/api';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { getLocalDate, getSeasonForDate } from '../../seasons/season-policy';
import type { UserEntity } from '../../users/entities/user.entity';
import { UsersRepository } from '../../users/repositories/users.repository';

import {
  toCommitteeDto,
  toCommitteeMembershipDto,
} from '../dto/committee-output';
import { CommitteesRepository } from '../repositories/committees.repository';
import {
  GetCurrentCommitteeRosterQuery,
  ListCommitteeMembershipsBySeasonQuery,
  ListCommitteesQuery,
} from './committee.queries';

@QueryHandler(GetCurrentCommitteeRosterQuery)
export class GetCurrentCommitteeRosterHandler
  implements
    IQueryHandler<
      GetCurrentCommitteeRosterQuery,
      CurrentCommitteeRosterDto | null
    >
{
  private readonly logger = new Logger(GetCurrentCommitteeRosterHandler.name);

  constructor(
    private readonly committeesRepository: CommitteesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(
    query: GetCurrentCommitteeRosterQuery,
  ): Promise<CurrentCommitteeRosterDto | null> {
    const committee = await this.committeesRepository.findById(
      query.committeeId,
    );

    if (!committee) {
      return null;
    }

    const season = getSeasonForDate(query.at);
    const memberships =
      await this.committeesRepository.findActiveMembershipsByCommitteeAndSeason(
        query.committeeId,
        season.key,
        getLocalDate(query.at),
      );
    const users = await this.usersRepository.findByIds(
      memberships.map(({ userId }) => userId),
    );
    const usersById = new Map(users.map((user) => [user.id, user]));
    const members = memberships
      .flatMap<CommitteeRosterMemberDto>((membership) => {
        const user = usersById.get(membership.userId);

        return user
          ? [
              {
                userId: user.id,
                name: displayName(user),
                imageUrl: user.imageUrl,
                role: membership.role,
              },
            ]
          : [];
      })
      .sort(compareRosterMembers);

    this.logger.debug({
      event: 'current_committee_roster_loaded',
      committeeId: committee.id,
      seasonKey: season.key,
      memberCount: members.length,
    });

    return { committee: toCommitteeDto(committee), season, members };
  }
}

function displayName(user: UserEntity): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.name ||
    user.email ||
    'Member'
  );
}

function compareRosterMembers(
  left: CommitteeRosterMemberDto,
  right: CommitteeRosterMemberDto,
): number {
  return left.name.localeCompare(right.name, 'nl', { sensitivity: 'base' });
}

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
