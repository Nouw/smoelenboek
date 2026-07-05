import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { TeamMembershipEntity } from '../entities/team-membership.entity';
import { TeamEntity } from '../entities/team.entity';
import type { TeamMembershipPayload, TeamSnapshotPayload } from '../events/team-events';

@Injectable()
export class TeamProjector {
  async projectTeamSnapshot(
    payload: TeamSnapshotPayload,
    manager: EntityManager,
  ): Promise<TeamEntity> {
    const repository = manager.getRepository(TeamEntity);
    const existing = await repository.findOneBy({ id: payload.teamId });
    const entity = existing ?? repository.create({ id: payload.teamId });

    entity.name = payload.name;
    entity.imageUrl = payload.imageUrl;
    entity.archivedAt = payload.archivedAt ? new Date(payload.archivedAt) : null;

    return repository.save(entity);
  }

  async projectMemberAssigned(
    payload: TeamMembershipPayload,
    manager: EntityManager,
  ): Promise<TeamMembershipEntity> {
    const repository = manager.getRepository(TeamMembershipEntity);
    const existing = await repository.findOneBy({ id: payload.membershipId });
    const entity = existing ?? repository.create({ id: payload.membershipId });

    entity.userId = payload.userId;
    entity.teamId = payload.teamId;
    entity.seasonId = payload.seasonId;
    entity.role = payload.role;

    return repository.save(entity);
  }

  async projectMemberRemoved(
    payload: TeamMembershipPayload,
    manager: EntityManager,
  ): Promise<TeamMembershipEntity | null> {
    const repository = manager.getRepository(TeamMembershipEntity);
    const existing = await repository.findOneBy({ id: payload.membershipId });

    if (!existing) {
      return null;
    }

    await repository.delete({ id: payload.membershipId });

    return existing;
  }
}
