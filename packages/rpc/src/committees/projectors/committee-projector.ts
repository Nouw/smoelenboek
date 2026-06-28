import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import { CommitteeEntity } from '../entities/committee.entity';
import type {
  CommitteeMembershipPayload,
  CommitteeSnapshotPayload,
} from '../events/committee-events';

@Injectable()
export class CommitteeProjector {
  async projectCommitteeSnapshot(
    payload: CommitteeSnapshotPayload,
    manager: EntityManager,
  ): Promise<CommitteeEntity> {
    const repository = manager.getRepository(CommitteeEntity);
    const existing = await repository.findOneBy({ id: payload.committeeId });
    const entity = existing ?? repository.create({ id: payload.committeeId });

    entity.name = payload.name;
    entity.archivedAt = payload.archivedAt ? new Date(payload.archivedAt) : null;

    return repository.save(entity);
  }

  async projectMemberAssigned(
    payload: CommitteeMembershipPayload,
    manager: EntityManager,
  ): Promise<CommitteeMembershipEntity> {
    const repository = manager.getRepository(CommitteeMembershipEntity);
    const existing = await repository.findOneBy({ id: payload.membershipId });
    const entity = existing ?? repository.create({ id: payload.membershipId });

    entity.userId = payload.userId;
    entity.committeeId = payload.committeeId;
    entity.seasonId = payload.seasonId;
    entity.role = payload.role;

    return repository.save(entity);
  }

  async projectMemberRemoved(
    payload: CommitteeMembershipPayload,
    manager: EntityManager,
  ): Promise<CommitteeMembershipEntity | null> {
    const repository = manager.getRepository(CommitteeMembershipEntity);
    const existing = await repository.findOneBy({ id: payload.membershipId });

    if (!existing) {
      return null;
    }

    await repository.delete({ id: payload.membershipId });

    return existing;
  }
}

