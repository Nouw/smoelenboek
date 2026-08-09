import type {
  CommitteeDto,
  CommitteeMembershipDto,
  CommitteeRosterForSeasonDto,
  CommitteeRosterMembershipDto,
  CommitteeRosterMemberDto,
  CurrentCommitteeRosterDto,
} from '@repo/api';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  getLocalDate,
  getSeason,
  getSeasonForDate,
} from '../../seasons/season-policy';
import { displayUserName } from '../../users/dto/user-output';
import { UsersRepository } from '../../users/repositories/users.repository';

import {
  toCommitteeDto,
  toCommitteeMembershipDto,
} from '../dto/committee-output';
import { CommitteesRepository } from '../repositories/committees.repository';
import {
  GetCurrentCommitteeRosterQuery,
  GetCommitteeRosterForSeasonQuery,
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
                name: displayUserName(user),
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

function compareRosterMembers(
  left: CommitteeRosterMemberDto,
  right: CommitteeRosterMemberDto,
): number {
  return left.name.localeCompare(right.name, 'nl', { sensitivity: 'base' });
}

@QueryHandler(GetCommitteeRosterForSeasonQuery)
export class GetCommitteeRosterForSeasonHandler
  implements
    IQueryHandler<
      GetCommitteeRosterForSeasonQuery,
      CommitteeRosterForSeasonDto | null
    >
{
  private readonly logger = new Logger(GetCommitteeRosterForSeasonHandler.name);

  constructor(
    private readonly committeesRepository: CommitteesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(
    query: GetCommitteeRosterForSeasonQuery,
  ): Promise<CommitteeRosterForSeasonDto | null> {
    const committee = await this.committeesRepository.findById(
      query.committeeId,
    );

    if (!committee) {
      return null;
    }

    const memberships =
      await this.committeesRepository.findMembershipsByCommitteeAndSeason(
        query.committeeId,
        query.seasonKey,
      );
    const users = await this.usersRepository.findByIds(
      memberships.map(({ userId }) => userId),
    );
    const usersById = new Map(users.map((user) => [user.id, user]));
    const enriched = memberships.flatMap<CommitteeRosterMembershipDto>(
      (membership) => {
        const user = usersById.get(membership.userId);

        return user
          ? [
              {
                ...toCommitteeMembershipDto(membership),
                user: {
                  id: user.id,
                  name: displayUserName(user),
                  email: user.email,
                  imageUrl: user.imageUrl,
                },
              },
            ]
          : [];
      },
    );

    enriched.sort((left, right) =>
      left.user.name.localeCompare(right.user.name, 'nl', {
        sensitivity: 'base',
      }),
    );

    this.logger.debug({
      event: 'committee_roster_for_season_loaded',
      committeeId: query.committeeId,
      seasonKey: query.seasonKey,
      membershipCount: enriched.length,
    });

    return {
      committee: toCommitteeDto(committee),
      season: getSeason(query.seasonKey),
      memberships: enriched,
    };
  }
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
