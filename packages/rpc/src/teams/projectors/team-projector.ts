import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';

import { DomainEventBase } from '../../event-store/domain-event';
import { TeamMembershipEntity } from '../entities/team-membership.entity';
import { TeamEntity } from '../entities/team.entity';
import {
  TeamArchivedEvent,
  TeamCreatedEvent,
  TeamMemberAssignedEvent,
  TeamMemberRemovedEvent,
  TeamRestoredEvent,
  TeamUpdatedEvent,
  type TeamMembershipAssignedPayload,
  type TeamMembershipRemovedPayload,
  type TeamSnapshotPayload,
} from '../events/team-events';

@EventsHandler(
  TeamCreatedEvent,
  TeamUpdatedEvent,
  TeamArchivedEvent,
  TeamRestoredEvent,
  TeamMemberAssignedEvent,
  TeamMemberRemovedEvent,
)
@Injectable()
export class TeamProjector implements IEventHandler<DomainEventBase> {
  constructor(private readonly dataSource: DataSource) {}

  async handle(event: DomainEventBase): Promise<void> {
    const manager = this.dataSource.manager;
    if (event instanceof TeamMemberAssignedEvent) {
      await this.projectMemberAssigned(event.payload, manager);
    } else if (event instanceof TeamMemberRemovedEvent) {
      await this.projectMemberRemoved(event.payload, manager);
    } else {
      await this.projectTeamSnapshot((event as TeamCreatedEvent).payload, manager);
    }
  }

  async projectTeamSnapshot(
    payload: TeamSnapshotPayload,
    manager: EntityManager,
  ): Promise<TeamEntity> {
    const repository = manager.getRepository(TeamEntity);
    const existing = await repository.findOneBy({ id: payload.teamId });
    const entity = existing ?? repository.create({ id: payload.teamId });

    entity.name = payload.name;
    entity.category = payload.category;
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
    payload: TeamMembershipRemovedPayload,
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
