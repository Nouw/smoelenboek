import type {
  CurrentTeamRosterDto,
  TeamDto,
  TeamMembershipDto,
  TeamRosterMemberDto,
  TeamRosterForSeasonDto,
  TeamRosterMembershipDto,
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
import { toTeamDto, toTeamMembershipDto } from '../dto/team-output';
import { TeamsRepository } from '../repositories/teams.repository';
import {
  GetCurrentTeamRosterQuery,
  GetTeamRosterForSeasonQuery,
  ListTeamMembershipsBySeasonQuery,
  ListTeamsQuery,
} from './team.queries';

@QueryHandler(GetCurrentTeamRosterQuery)
export class GetCurrentTeamRosterHandler
  implements
    IQueryHandler<GetCurrentTeamRosterQuery, CurrentTeamRosterDto | null>
{
  private readonly logger = new Logger(GetCurrentTeamRosterHandler.name);

  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(
    query: GetCurrentTeamRosterQuery,
  ): Promise<CurrentTeamRosterDto | null> {
    const team = await this.teamsRepository.findById(query.teamId);

    if (!team) {
      return null;
    }

    const season = getSeasonForDate(query.at);
    const memberships =
      await this.teamsRepository.findActiveMembershipsByTeamAndSeason(
        query.teamId,
        season.key,
        getLocalDate(query.at),
      );
    const users = await this.usersRepository.findByIds(
      memberships.map(({ userId }) => userId),
    );
    const usersById = new Map(users.map((user) => [user.id, user]));
    const members = memberships.flatMap<TeamRosterMemberDto>((membership) => {
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
    });
    const coaches = members
      .filter(({ role }) => role === 'coach_trainer')
      .sort(compareRosterMembers);
    const players = members
      .filter(({ role }) => role !== 'coach_trainer')
      .sort(compareRosterMembers);

    this.logger.debug({
      event: 'current_team_roster_loaded',
      teamId: team.id,
      seasonKey: season.key,
      coachCount: coaches.length,
      playerCount: players.length,
    });

    return { team: toTeamDto(team), season, coaches, players };
  }
}

function compareRosterMembers(
  left: TeamRosterMemberDto,
  right: TeamRosterMemberDto,
): number {
  return left.name.localeCompare(right.name, 'nl', { sensitivity: 'base' });
}

@QueryHandler(GetTeamRosterForSeasonQuery)
export class GetTeamRosterForSeasonHandler
  implements
    IQueryHandler<GetTeamRosterForSeasonQuery, TeamRosterForSeasonDto | null>
{
  private readonly logger = new Logger(GetTeamRosterForSeasonHandler.name);

  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(
    query: GetTeamRosterForSeasonQuery,
  ): Promise<TeamRosterForSeasonDto | null> {
    const team = await this.teamsRepository.findById(query.teamId);

    if (!team) {
      return null;
    }

    const memberships =
      await this.teamsRepository.findMembershipsByTeamAndSeason(
        query.teamId,
        query.seasonKey,
      );
    const users = await this.usersRepository.findByIds(
      memberships.map(({ userId }) => userId),
    );
    const usersById = new Map(users.map((user) => [user.id, user]));
    const enriched = memberships.flatMap<TeamRosterMembershipDto>(
      (membership) => {
        const user = usersById.get(membership.userId);

        return user
          ? [
              {
                ...toTeamMembershipDto(membership),
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
      event: 'team_roster_for_season_loaded',
      teamId: query.teamId,
      seasonKey: query.seasonKey,
      membershipCount: enriched.length,
      endedMembershipCount: enriched.filter(({ endedOn }) => endedOn !== null)
        .length,
    });

    return {
      team: toTeamDto(team),
      season: getSeason(query.seasonKey),
      memberships: enriched,
    };
  }
}

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
