import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { resolveMembershipEnd } from '../../seasons/season-policy';
import { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import { CommitteeEntity } from '../entities/committee.entity';
import type {
  CommitteeMembershipAssignedPayload,
  CommitteeMembershipEndedPayload,
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
    entity.archivedAt = payload.archivedAt
      ? new Date(payload.archivedAt)
      : null;

    return repository.save(entity);
  }

  async projectMemberAssigned(
    payload: CommitteeMembershipAssignedPayload,
    manager: EntityManager,
  ): Promise<CommitteeMembershipEntity> {
    const repository = manager.getRepository(CommitteeMembershipEntity);
    const existing = await repository.findOneBy({ id: payload.membershipId });
    const entity = existing ?? repository.create({ id: payload.membershipId });

    entity.userId = payload.userId;
    entity.committeeId = payload.committeeId;
    entity.seasonKey = payload.seasonKey;
    entity.role = payload.role;
    entity.startedOn = payload.startedOn;
    entity.endedOn = payload.endedOn;

    return repository.save(entity);
  }

  async projectMemberRemoved(
    payload: CommitteeMembershipEndedPayload,
    manager: EntityManager,
  ): Promise<CommitteeMembershipEntity | null> {
    const repository = manager.getRepository(CommitteeMembershipEntity);
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
