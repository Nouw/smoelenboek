import type { TeamDto, TeamMembershipDto } from '@repo/api';

import type { TeamMembershipEntity } from '../entities/team-membership.entity';
import type { TeamEntity } from '../entities/team.entity';

export function toTeamDto(team: TeamEntity): TeamDto {
  return {
    id: team.id,
    name: team.name,
    imageUrl: team.imageUrl,
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
    seasonKey: membership.seasonKey,
    role: membership.role,
    startedOn: membership.startedOn,
    endedOn: membership.endedOn,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
  };
}
