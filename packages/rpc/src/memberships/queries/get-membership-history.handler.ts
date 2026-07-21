import type { MembershipHistoryDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toCommitteeMembershipDto } from '../../committees/dto/committee-output';
import { CommitteesRepository } from '../../committees/repositories/committees.repository';
import { toTeamMembershipDto } from '../../teams/dto/team-output';
import { TeamsRepository } from '../../teams/repositories/teams.repository';
import { getSeason } from '../../seasons/season-policy';
import { GetMembershipHistoryQuery } from './get-membership-history.query';

@QueryHandler(GetMembershipHistoryQuery)
export class GetMembershipHistoryHandler
  implements IQueryHandler<GetMembershipHistoryQuery, MembershipHistoryDto>
{
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(
    query: GetMembershipHistoryQuery,
  ): Promise<MembershipHistoryDto> {
    const [teamMemberships, committeeMemberships] = await Promise.all([
      this.teamsRepository.findMembershipsByUser(query.userId),
      this.committeesRepository.findMembershipsByUser(query.userId),
    ]);
    const seasonKeys = [
      ...new Set([
        ...teamMemberships.map((membership) => membership.seasonKey),
        ...committeeMemberships.map((membership) => membership.seasonKey),
      ]),
    ].sort((left, right) => right - left);

    return {
      userId: query.userId,
      seasonCount: seasonKeys.length,
      seasons: seasonKeys.map((seasonKey) => {
        const season = getSeason(seasonKey);

        return {
          seasonKey,
          label: season.label,
          startsOn: season.startsOn,
          endsBefore: season.endsBefore,
          teamMemberships: teamMemberships
            .filter((membership) => membership.seasonKey === seasonKey)
            .map(toTeamMembershipDto),
          committeeMemberships: committeeMemberships
            .filter((membership) => membership.seasonKey === seasonKey)
            .map(toCommitteeMembershipDto),
        };
      }),
    };
  }
}
