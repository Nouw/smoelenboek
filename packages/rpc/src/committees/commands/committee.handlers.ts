import type { CommitteeDto, CommitteeMembershipDto } from '@repo/api';
import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import {
  getLocalDate,
  getSeasonKey,
  resolveMembershipStart,
} from '../../seasons/season-policy';
import {
  toCommitteeDto,
  toCommitteeMembershipDto,
} from '../dto/committee-output';
import {
  CommitteeArchivedEvent,
  CommitteeCreatedEvent,
  CommitteeMemberAssignedEvent,
  CommitteeMemberRemovedEvent,
  CommitteeUpdatedEvent,
} from '../events/committee-events';
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
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: CreateCommitteeCommand): Promise<CommitteeDto> {
    const committeeId = randomUUID();
    const event = CommitteeCreatedEvent.create({
      committeeId,
      name: command.name,
      archivedAt: null,
    });
    await this.eventStorePublisher.appendAndPublish(event);
    const committee = await this.committeesRepository.findById(committeeId);
    if (!committee) throw new Error('Committee projection missing after dispatch.');
    return toCommitteeDto(committee);
  }
}

@CommandHandler(UpdateCommitteeCommand)
export class UpdateCommitteeHandler
  implements ICommandHandler<UpdateCommitteeCommand, CommitteeDto>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: UpdateCommitteeCommand): Promise<CommitteeDto> {
    const existing = await this.committeesRepository.findById(command.id);
    if (!existing) throw new NotFoundException('Committee not found.');

    const event = CommitteeUpdatedEvent.create({
      committeeId: command.id,
      name: command.name,
      archivedAt: existing.archivedAt?.toISOString() ?? null,
    });
    await this.eventStorePublisher.appendAndPublish(event);
    const committee = await this.committeesRepository.findById(command.id);
    if (!committee) throw new Error('Committee projection missing after dispatch.');
    return toCommitteeDto(committee);
  }
}

@CommandHandler(ArchiveCommitteeCommand)
export class ArchiveCommitteeHandler
  implements ICommandHandler<ArchiveCommitteeCommand, CommitteeDto>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: ArchiveCommitteeCommand): Promise<CommitteeDto> {
    const existing = await this.committeesRepository.findById(command.id);
    if (!existing) throw new NotFoundException('Committee not found.');

    const event = CommitteeArchivedEvent.create({
      committeeId: command.id,
      name: existing.name,
      archivedAt: new Date().toISOString(),
    });
    await this.eventStorePublisher.appendAndPublish(event);
    const committee = await this.committeesRepository.findById(command.id);
    if (!committee) throw new Error('Committee projection missing after dispatch.');
    return toCommitteeDto(committee);
  }
}

@CommandHandler(AssignCommitteeMemberCommand)
export class AssignCommitteeMemberHandler
  implements
    ICommandHandler<AssignCommitteeMemberCommand, CommitteeMembershipDto>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(
    command: AssignCommitteeMemberCommand,
  ): Promise<CommitteeMembershipDto> {
    const seasonKey = command.seasonKey ?? getSeasonKey(new Date());
    const membershipId = randomUUID();
    const event = CommitteeMemberAssignedEvent.create({
      membershipId,
      userId: command.userId,
      committeeId: command.committeeId,
      seasonKey,
      role: command.role,
      startedOn: resolveMembershipStart(seasonKey, command.startedOn),
      endedOn: null,
    });
    await this.eventStorePublisher.appendAndPublish(event);
    const membership =
      await this.committeesRepository.findMembershipById(membershipId);
    if (!membership)
      throw new Error(
        'Committee membership projection missing after dispatch.',
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
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(
    command: RemoveCommitteeMemberCommand,
  ): Promise<CommitteeMembershipDto | null> {
    const event = CommitteeMemberRemovedEvent.create({
      membershipId: command.membershipId,
      removedOn: getLocalDate(new Date()),
    });
    await this.eventStorePublisher.appendAndPublish(event);
    const membership = await this.committeesRepository.findMembershipById(
      command.membershipId,
    );
    return membership ? toCommitteeMembershipDto(membership) : null;
  }
}
