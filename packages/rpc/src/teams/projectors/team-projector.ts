import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { resolveMembershipEnd } from '../../seasons/season-policy';
import { TeamMembershipEntity } from '../entities/team-membership.entity';
import { TeamEntity } from '../entities/team.entity';
import type {
  TeamMembershipAssignedPayload,
  TeamMembershipEndedPayload,
  TeamSnapshotPayload,
} from '../events/team-events';

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
    entity.archivedAt = payload.archivedAt
      ? new Date(payload.archivedAt)
      : null;

    return repository.save(entity);
  }

  async projectMemberAssigned(
    payload: TeamMembershipAssignedPayload,
    manager: EntityManager,
  ): Promise<TeamMembershipEntity> {
    const repository = manager.getRepository(TeamMembershipEntity);
    const existing = await repository.findOneBy({ id: payload.membershipId });
    const entity = existing ?? repository.create({ id: payload.membershipId });

    entity.userId = payload.userId;
    entity.teamId = payload.teamId;
    entity.seasonKey = payload.seasonKey;
    entity.role = payload.role;
    entity.startedOn = payload.startedOn;
    entity.endedOn = payload.endedOn;

    return repository.save(entity);
  }

  async projectMemberRemoved(
    payload: TeamMembershipEndedPayload,
    manager: EntityManager,
  ): Promise<TeamMembershipEntity | null> {
    const repository = manager.getRepository(TeamMembershipEntity);
    const existing = await repository.findOneBy({ id: payload.membershipId });

    if (!existing) {
      return null;
    }

    if (existing.endedOn === null) {
      existing.endedOn = resolveMembershipEnd(
        existing.seasonKey,
        existing.startedOn,
        payload.removedOn,
      );
      await repository.save(existing);
    }

    return existing;
  }
}
