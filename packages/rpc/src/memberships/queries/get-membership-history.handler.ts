import type { MembershipHistoryDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toCommitteeMembershipDto } from '../../committees/dto/committee-output';
import { CommitteesRepository } from '../../committees/repositories/committees.repository';
import { toTeamMembershipDto } from '../../teams/dto/team-output';
import { TeamsRepository } from '../../teams/repositories/teams.repository';
import { GetMembershipHistoryQuery } from './get-membership-history.query';

@QueryHandler(GetMembershipHistoryQuery)
export class GetMembershipHistoryHandler
  implements IQueryHandler<GetMembershipHistoryQuery, MembershipHistoryDto>
{
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(query: GetMembershipHistoryQuery): Promise<MembershipHistoryDto> {
    const [teamMemberships, committeeMemberships] = await Promise.all([
      this.teamsRepository.findMembershipsByUser(query.userId),
      this.committeesRepository.findMembershipsByUser(query.userId),
    ]);
    const seasonIds = [
      ...new Set([
        ...teamMemberships.map((membership) => membership.seasonId),
        ...committeeMemberships.map((membership) => membership.seasonId),
      ]),
    ].sort();

    return {
      userId: query.userId,
      seasonCount: seasonIds.length,
      seasons: seasonIds.map((seasonId) => ({
        seasonId,
        teamMemberships: teamMemberships
          .filter((membership) => membership.seasonId === seasonId)
          .map(toTeamMembershipDto),
        committeeMemberships: committeeMemberships
          .filter((membership) => membership.seasonId === seasonId)
          .map(toCommitteeMembershipDto),
      })),
    };
  }
}

