import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';

import { DomainEventBase } from '../../event-store/domain-event';
import { resolveMembershipEnd } from '../../seasons/season-policy';
import { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import { CommitteeEntity } from '../entities/committee.entity';
import {
  CommitteeArchivedEvent,
  CommitteeCreatedEvent,
  CommitteeMemberAssignedEvent,
  CommitteeMemberRemovedEvent,
  CommitteeUpdatedEvent,
  type CommitteeMembershipAssignedPayload,
  type CommitteeMembershipEndedPayload,
  type CommitteeSnapshotPayload,
} from '../events/committee-events';

@EventsHandler(
  CommitteeCreatedEvent,
  CommitteeUpdatedEvent,
  CommitteeArchivedEvent,
  CommitteeMemberAssignedEvent,
  CommitteeMemberRemovedEvent,
)
@Injectable()
export class CommitteeProjector implements IEventHandler<DomainEventBase> {
  constructor(private readonly dataSource: DataSource) {}

  async handle(event: DomainEventBase): Promise<void> {
    const manager = this.dataSource.manager;
    if (event instanceof CommitteeMemberAssignedEvent) {
      await this.projectMemberAssigned(event.payload, manager);
    } else if (event instanceof CommitteeMemberRemovedEvent) {
      await this.projectMemberRemoved(event.payload, manager);
    } else {
      await this.projectCommitteeSnapshot((event as CommitteeCreatedEvent).payload, manager);
    }
  }

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
