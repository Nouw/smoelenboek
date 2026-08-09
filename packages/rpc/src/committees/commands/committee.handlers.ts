import type { CommitteeDto, CommitteeMembershipDto } from '@repo/api';
import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { resolveMembershipStart } from '../../seasons/season-policy';
import { UsersRepository } from '../../users/repositories/users.repository';
import {
  toCommitteeDto,
  toCommitteeMembershipDto,
} from '../dto/committee-output';
import {
  CommitteeArchivedEvent,
  CommitteeCreatedEvent,
  CommitteeMemberAssignedEvent,
  CommitteeMemberRemovedEvent,
  CommitteeRestoredEvent,
  CommitteeUpdatedEvent,
} from '../events/committee-events';
import { CommitteesRepository } from '../repositories/committees.repository';
import {
  ArchiveCommitteeCommand,
  AssignCommitteeMemberCommand,
  CreateCommitteeCommand,
  RemoveCommitteeMemberCommand,
  RestoreCommitteeCommand,
  UpdateCommitteeCommand,
} from './committee.commands';

@CommandHandler(CreateCommitteeCommand)
export class CreateCommitteeHandler
  implements ICommandHandler<CreateCommitteeCommand, CommitteeDto>
{
  private readonly logger = new Logger(CreateCommitteeHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: CreateCommitteeCommand): Promise<CommitteeDto> {
    const duplicate = await this.committeesRepository.findByNameCaseInsensitive(
      command.name,
    );

    if (duplicate) {
      throw new ConflictException('A committee with this name already exists.');
    }

    const event = CommitteeCreatedEvent.create(
      {
        committeeId: randomUUID(),
        name: command.name,
        imageUrl: command.imageUrl,
        archivedAt: null,
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const committee = await this.committeesRepository.findById(
      event.payload.committeeId,
    );

    if (!committee) {
      throw new Error('Committee projection missing after dispatch.');
    }

    this.logger.log({
      event: 'committee_created',
      committeeId: committee.id,
      actorUserId: command.actorUserId,
    });

    return toCommitteeDto(committee);
  }
}

@CommandHandler(UpdateCommitteeCommand)
export class UpdateCommitteeHandler
  implements ICommandHandler<UpdateCommitteeCommand, CommitteeDto>
{
  private readonly logger = new Logger(UpdateCommitteeHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: UpdateCommitteeCommand): Promise<CommitteeDto> {
    const existing = await this.committeesRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Committee not found.');
    }

    const duplicate = await this.committeesRepository.findByNameCaseInsensitive(
      command.name,
    );

    if (duplicate && duplicate.id !== command.id) {
      throw new ConflictException('A committee with this name already exists.');
    }

    const event = CommitteeUpdatedEvent.create(
      {
        committeeId: command.id,
        name: command.name,
        imageUrl:
          command.imageUrl === undefined ? existing.imageUrl : command.imageUrl,
        archivedAt: existing.archivedAt?.toISOString() ?? null,
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const committee = await this.committeesRepository.findById(command.id);

    if (!committee) {
      throw new Error('Committee projection missing after dispatch.');
    }

    this.logger.log({
      event: 'committee_updated',
      committeeId: committee.id,
      actorUserId: command.actorUserId,
    });

    return toCommitteeDto(committee);
  }
}

@CommandHandler(ArchiveCommitteeCommand)
export class ArchiveCommitteeHandler
  implements ICommandHandler<ArchiveCommitteeCommand, CommitteeDto>
{
  private readonly logger = new Logger(ArchiveCommitteeHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: ArchiveCommitteeCommand): Promise<CommitteeDto> {
    const existing = await this.committeesRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Committee not found.');
    }
    if (existing.archivedAt) {
      return toCommitteeDto(existing);
    }

    const event = CommitteeArchivedEvent.create(
      {
        committeeId: existing.id,
        name: existing.name,
        imageUrl: existing.imageUrl,
        archivedAt: new Date().toISOString(),
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const committee = await this.committeesRepository.findById(command.id);

    if (!committee) {
      throw new Error('Committee projection missing after dispatch.');
    }

    this.logger.log({
      event: 'committee_archived',
      committeeId: committee.id,
      actorUserId: command.actorUserId,
    });

    return toCommitteeDto(committee);
  }
}

@CommandHandler(RestoreCommitteeCommand)
export class RestoreCommitteeHandler
  implements ICommandHandler<RestoreCommitteeCommand, CommitteeDto>
{
  private readonly logger = new Logger(RestoreCommitteeHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(command: RestoreCommitteeCommand): Promise<CommitteeDto> {
    const existing = await this.committeesRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Committee not found.');
    }
    if (!existing.archivedAt) {
      return toCommitteeDto(existing);
    }

    const event = CommitteeRestoredEvent.create(
      {
        committeeId: existing.id,
        name: existing.name,
        imageUrl: existing.imageUrl,
        archivedAt: null,
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const committee = await this.committeesRepository.findById(command.id);

    if (!committee) {
      throw new Error('Committee projection missing after dispatch.');
    }

    this.logger.log({
      event: 'committee_restored',
      committeeId: committee.id,
      actorUserId: command.actorUserId,
    });

    return toCommitteeDto(committee);
  }
}

@CommandHandler(AssignCommitteeMemberCommand)
export class AssignCommitteeMemberHandler
  implements
    ICommandHandler<AssignCommitteeMemberCommand, CommitteeMembershipDto>
{
  private readonly logger = new Logger(AssignCommitteeMemberHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(
    command: AssignCommitteeMemberCommand,
  ): Promise<CommitteeMembershipDto> {
    const [committee, user, duplicate] = await Promise.all([
      this.committeesRepository.findById(command.committeeId),
      this.usersRepository.findById(command.userId),
      this.committeesRepository.findActiveAssignment(
        command.userId,
        command.committeeId,
        command.seasonKey,
        command.role,
      ),
    ]);

    if (!committee) {
      throw new NotFoundException('Committee not found.');
    }
    if (committee.archivedAt) {
      throw new ConflictException(
        'Restore this committee before assigning members.',
      );
    }
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (duplicate) {
      throw new ConflictException(
        'This user already has this active committee role for the selected season.',
      );
    }

    let startedOn: string;
    try {
      startedOn = resolveMembershipStart(command.seasonKey, command.startedOn);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Invalid membership start date.',
      );
    }

    const membershipId = randomUUID();
    const event = CommitteeMemberAssignedEvent.create(
      {
        membershipId,
        userId: command.userId,
        committeeId: command.committeeId,
        seasonKey: command.seasonKey,
        role: command.role,
        startedOn,
        endedOn: null,
      },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const membership =
      await this.committeesRepository.findMembershipById(membershipId);

    if (!membership) {
      throw new Error(
        'Committee membership projection missing after dispatch.',
      );
    }

    this.logger.log({
      event: 'committee_member_assigned',
      membershipId: membership.id,
      committeeId: membership.committeeId,
      userId: membership.userId,
      seasonKey: membership.seasonKey,
      role: membership.role,
      actorUserId: command.actorUserId,
    });

    return toCommitteeMembershipDto(membership);
  }
}

@CommandHandler(RemoveCommitteeMemberCommand)
export class RemoveCommitteeMemberHandler
  implements
    ICommandHandler<RemoveCommitteeMemberCommand, CommitteeMembershipDto>
{
  private readonly logger = new Logger(RemoveCommitteeMemberHandler.name);

  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(
    command: RemoveCommitteeMemberCommand,
  ): Promise<CommitteeMembershipDto> {
    const existing = await this.committeesRepository.findMembershipById(
      command.membershipId,
    );

    if (!existing) {
      throw new NotFoundException('Committee membership not found.');
    }

    const event = CommitteeMemberRemovedEvent.create(
      { membershipId: command.membershipId },
      command.actorUserId,
    );
    await this.eventStorePublisher.appendAndPublish(event);

    this.logger.log({
      event: 'committee_membership_removed',
      membershipId: existing.id,
      actorUserId: command.actorUserId,
    });

    return toCommitteeMembershipDto(existing);
  }
}
