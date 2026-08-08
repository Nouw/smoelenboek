import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { ProtototoRoundEntity } from '../entities/protototo-round.entity';
import {
  ProtototoRoundArchivedEvent,
  ProtototoRoundPublishedEvent,
  ProtototoRoundSavedEvent,
} from '../events/protototo.events';
import { ProtototoRepository } from '../repositories/protototo.repository';
import {
  ArchiveProtototoRoundCommand,
  CreateProtototoRoundCommand,
  PublishProtototoRoundCommand,
  UpdateProtototoRoundCommand,
} from './protototo.commands';

@CommandHandler(CreateProtototoRoundCommand)
export class CreateProtototoRoundHandler
  implements ICommandHandler<CreateProtototoRoundCommand, ProtototoRoundEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: ProtototoRepository,
  ) {}

  async execute(
    command: CreateProtototoRoundCommand,
  ): Promise<ProtototoRoundEntity> {
    validateDates(command.opensAt, command.closesAt);
    const roundId = randomUUID();
    const event = ProtototoRoundSavedEvent.create(
      {
        roundId,
        title: command.title.trim(),
        opensAt: command.opensAt.toISOString(),
        closesAt: command.closesAt.toISOString(),
        tikkieUrl: command.tikkieUrl,
        publishedAt: null,
        archivedAt: null,
      },
      command.actorId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const round = await this.repository.findRound(roundId);
    if (!round) throw new Error('Round projection missing after dispatch.');
    return round;
  }
}

@CommandHandler(UpdateProtototoRoundCommand)
export class UpdateProtototoRoundHandler
  implements ICommandHandler<UpdateProtototoRoundCommand, ProtototoRoundEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: ProtototoRepository,
  ) {}

  async execute(
    command: UpdateProtototoRoundCommand,
  ): Promise<ProtototoRoundEntity> {
    validateDates(command.opensAt, command.closesAt);
    const existing = await requireRound(this.repository, command.roundId);
    if (!existing.publishedAt) {
      await validateDeadline(
        this.repository,
        command.roundId,
        command.closesAt,
      );
    }
    if (existing.publishedAt) {
      await validateNoOverlap(
        this.repository,
        command.opensAt,
        command.closesAt,
        command.roundId,
      );
    }
    const event = ProtototoRoundSavedEvent.create(
      {
        roundId: existing.id,
        title: command.title.trim(),
        opensAt: command.opensAt.toISOString(),
        closesAt: command.closesAt.toISOString(),
        tikkieUrl: command.tikkieUrl,
        publishedAt: existing.publishedAt?.toISOString() ?? null,
        archivedAt: existing.archivedAt?.toISOString() ?? null,
      },
      command.actorId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const round = await this.repository.findRound(command.roundId);
    if (!round) throw new Error('Round projection missing after dispatch.');
    return round;
  }
}

@CommandHandler(PublishProtototoRoundCommand)
export class PublishProtototoRoundHandler
  implements ICommandHandler<PublishProtototoRoundCommand, ProtototoRoundEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: ProtototoRepository,
  ) {}

  async execute(
    command: PublishProtototoRoundCommand,
  ): Promise<ProtototoRoundEntity> {
    const existing = await requireRound(this.repository, command.roundId);
    const matches = await this.repository.findActiveMatches(command.roundId);
    if (matches.length === 0) {
      throw new BadRequestException('A round needs at least one active match.');
    }
    await validateDeadline(this.repository, existing.id, existing.closesAt);
    await validateNoOverlap(
      this.repository,
      existing.opensAt,
      existing.closesAt,
      existing.id,
    );
    const event = ProtototoRoundPublishedEvent.create(
      {
        roundId: existing.id,
        title: existing.title,
        opensAt: existing.opensAt.toISOString(),
        closesAt: existing.closesAt.toISOString(),
        tikkieUrl: existing.tikkieUrl,
        publishedAt:
          existing.publishedAt?.toISOString() ?? new Date().toISOString(),
        archivedAt: null,
      },
      command.actorId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const round = await this.repository.findRound(command.roundId);
    if (!round) throw new Error('Round projection missing after dispatch.');
    return round;
  }
}

@CommandHandler(ArchiveProtototoRoundCommand)
export class ArchiveProtototoRoundHandler
  implements ICommandHandler<ArchiveProtototoRoundCommand, ProtototoRoundEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: ProtototoRepository,
  ) {}

  async execute(
    command: ArchiveProtototoRoundCommand,
  ): Promise<ProtototoRoundEntity> {
    const existing = await requireRound(this.repository, command.roundId);
    const event = ProtototoRoundArchivedEvent.create(
      {
        roundId: existing.id,
        title: existing.title,
        opensAt: existing.opensAt.toISOString(),
        closesAt: existing.closesAt.toISOString(),
        tikkieUrl: existing.tikkieUrl,
        publishedAt: existing.publishedAt?.toISOString() ?? null,
        archivedAt: new Date().toISOString(),
      },
      command.actorId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const round = await this.repository.findRound(command.roundId);
    if (!round) throw new Error('Round projection missing after dispatch.');
    return round;
  }
}

async function requireRound(
  repository: ProtototoRepository,
  roundId: string,
): Promise<ProtototoRoundEntity> {
  const round = await repository.findRound(roundId);
  if (!round) {
    throw new NotFoundException('Protototo round not found.');
  }
  return round;
}

function validateDates(opensAt: Date, closesAt: Date): void {
  if (opensAt.getTime() >= closesAt.getTime()) {
    throw new BadRequestException(
      'The opening time must precede the deadline.',
    );
  }
}

async function validateDeadline(
  repository: ProtototoRepository,
  roundId: string,
  closesAt: Date,
): Promise<void> {
  const [first] = await repository.findActiveMatches(roundId);
  if (first && closesAt.getTime() > first.startsAt.getTime()) {
    throw new BadRequestException(
      'The betting deadline must not be later than the earliest match.',
    );
  }
}

async function validateNoOverlap(
  repository: ProtototoRepository,
  opensAt: Date,
  closesAt: Date,
  excludeId: string,
): Promise<void> {
  const overlapping = await repository.findOverlappingPublishedRound(
    opensAt,
    closesAt,
    excludeId,
  );
  if (overlapping) {
    throw new ConflictException('Published Protototo rounds may not overlap.');
  }
}
