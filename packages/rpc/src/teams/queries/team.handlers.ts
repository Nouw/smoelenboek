import type { TeamDto, TeamMembershipDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toTeamDto, toTeamMembershipDto } from '../dto/team-output';
import { TeamsRepository } from '../repositories/teams.repository';
import {
  ListTeamMembershipsBySeasonQuery,
  ListTeamsQuery,
} from './team.queries';

@QueryHandler(ListTeamsQuery)
export class ListTeamsHandler
  implements IQueryHandler<ListTeamsQuery, TeamDto[]>
{
  constructor(private readonly teamsRepository: TeamsRepository) {}

  async execute(): Promise<TeamDto[]> {
    const teams = await this.teamsRepository.findAll();

    return teams.sort(compareTeamsByNameNumber).map(toTeamDto);
  }
}

function compareTeamsByNameNumber(
  left: { name: string },
  right: { name: string },
): number {
  const leftNumber = teamNameNumber(left.name);
  const rightNumber = teamNameNumber(right.name);

  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  return left.name.localeCompare(right.name, 'nl', {
    numeric: true,
    sensitivity: 'base',
  });
}

function teamNameNumber(name: string): number {
  const match = /\b(\d+)\b/.exec(name);

  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

@QueryHandler(ListTeamMembershipsBySeasonQuery)
export class ListTeamMembershipsBySeasonHandler
  implements
    IQueryHandler<ListTeamMembershipsBySeasonQuery, TeamMembershipDto[]>
{
  constructor(private readonly teamsRepository: TeamsRepository) {}

  async execute(
    query: ListTeamMembershipsBySeasonQuery,
  ): Promise<TeamMembershipDto[]> {
    const memberships = await this.teamsRepository.findMembershipsBySeason(
      query.seasonKey,
    );

    return memberships.map(toTeamMembershipDto);
  }
}
