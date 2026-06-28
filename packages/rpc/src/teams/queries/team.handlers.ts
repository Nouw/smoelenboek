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

    return teams.map(toTeamDto);
  }
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
      query.seasonId,
    );

    return memberships.map(toTeamMembershipDto);
  }
}

