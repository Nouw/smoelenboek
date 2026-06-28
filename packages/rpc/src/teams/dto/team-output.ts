import type { TeamDto, TeamMembershipDto } from '@repo/api';

import type { TeamMembershipEntity } from '../entities/team-membership.entity';
import type { TeamEntity } from '../entities/team.entity';

export function toTeamDto(team: TeamEntity): TeamDto {
  return {
    id: team.id,
    name: team.name,
    archivedAt: team.archivedAt?.toISOString() ?? null,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}

export function toTeamMembershipDto(
  membership: TeamMembershipEntity,
): TeamMembershipDto {
  return {
    id: membership.id,
    userId: membership.userId,
    teamId: membership.teamId,
    seasonId: membership.seasonId,
    role: membership.role,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
  };
}

