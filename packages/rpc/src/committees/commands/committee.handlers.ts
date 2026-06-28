import type { CommitteeDto, CommitteeMembershipDto } from '@repo/api';
import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import {
  toCommitteeDto,
  toCommitteeMembershipDto,
} from '../dto/committee-output';
import {
  createCommitteeArchivedEvent,
  createCommitteeCreatedEvent,
  createCommitteeMemberAssignedEvent,
  createCommitteeMemberRemovedEvent,
  createCommitteeUpdatedEvent,
} from '../events/committee-events';
import { CommitteeProjector } from '../projectors/committee-projector';
import { CommitteesRepository } from '../repositories/committees.repository';
import {
  ArchiveCommitteeCommand,
  AssignCommitteeMemberCommand,
  CreateCommitteeCommand,
  RemoveCommitteeMemberCommand,
  UpdateCommitteeCommand,
} from './committee.commands';

@CommandHandler(CreateCommitteeCommand)
export class CreateCommitteeHandler
  implements ICommandHandler<CreateCommitteeCommand, CommitteeDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly committeeProjector: CommitteeProjector,
  ) {}

  async execute(command: CreateCommitteeCommand): Promise<CommitteeDto> {
    const event = createCommitteeCreatedEvent({
      committeeId: randomUUID(),
      name: command.name,
      archivedAt: null,
    });
    const committee = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.committeeProjector.projectCommitteeSnapshot(
          event.payload,
          manager,
        ),
    );

    return toCommitteeDto(committee);
  }
}

@CommandHandler(UpdateCommitteeCommand)
export class UpdateCommitteeHandler
  implements ICommandHandler<UpdateCommitteeCommand, CommitteeDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly committeeProjector: CommitteeProjector,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: UpdateCommitteeCommand): Promise<CommitteeDto> {
    const existing = await this.committeesRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Committee not found.');
    }

    const event = createCommitteeUpdatedEvent({
      committeeId: command.id,
      name: command.name,
      archivedAt: existing.archivedAt?.toISOString() ?? null,
    });
    const committee = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.committeeProjector.projectCommitteeSnapshot(
          event.payload,
          manager,
        ),
    );

    return toCommitteeDto(committee);
  }
}

@CommandHandler(ArchiveCommitteeCommand)
export class ArchiveCommitteeHandler
  implements ICommandHandler<ArchiveCommitteeCommand, CommitteeDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly committeeProjector: CommitteeProjector,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: ArchiveCommitteeCommand): Promise<CommitteeDto> {
    const existing = await this.committeesRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Committee not found.');
    }

    const event = createCommitteeArchivedEvent({
      committeeId: command.id,
      name: existing.name,
      archivedAt: new Date().toISOString(),
    });
    const committee = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.committeeProjector.projectCommitteeSnapshot(
          event.payload,
          manager,
        ),
    );

    return toCommitteeDto(committee);
  }
}

@CommandHandler(AssignCommitteeMemberCommand)
export class AssignCommitteeMemberHandler
  implements
    ICommandHandler<AssignCommitteeMemberCommand, CommitteeMembershipDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly committeeProjector: CommitteeProjector,
  ) {}

  async execute(
    command: AssignCommitteeMemberCommand,
  ): Promise<CommitteeMembershipDto> {
    const event = createCommitteeMemberAssignedEvent({
      membershipId: randomUUID(),
      userId: command.userId,
      committeeId: command.committeeId,
      seasonId: command.seasonId,
      role: command.role,
    });
    const membership = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.committeeProjector.projectMemberAssigned(event.payload, manager),
    );

    return toCommitteeMembershipDto(membership);
  }
}

@CommandHandler(RemoveCommitteeMemberCommand)
export class RemoveCommitteeMemberHandler
  implements
    ICommandHandler<RemoveCommitteeMemberCommand, CommitteeMembershipDto | null>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly committeeProjector: CommitteeProjector,
  ) {}

  async execute(
    command: RemoveCommitteeMemberCommand,
  ): Promise<CommitteeMembershipDto | null> {
    const event = createCommitteeMemberRemovedEvent({
      membershipId: command.membershipId,
      userId: '',
      committeeId: '',
      seasonId: '',
      role: 'commissielid',
    });
    const membership = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.committeeProjector.projectMemberRemoved(event.payload, manager),
    );

    return membership ? toCommitteeMembershipDto(membership) : null;
  }
}

