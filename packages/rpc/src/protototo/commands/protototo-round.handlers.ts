import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { ProtototoRoundEntity } from '../entities/protototo-round.entity';
import { roundEvent } from '../events/protototo.events';
import { ProtototoProjector } from '../projectors/protototo.projector';
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
    private readonly events: EventStoreRepository,
    private readonly projector: ProtototoProjector,
  ) {}

  execute(command: CreateProtototoRoundCommand): Promise<ProtototoRoundEntity> {
    validateDates(command.opensAt, command.closesAt);
    const event = roundEvent(
      'protototo.round_saved',
      {
        roundId: randomUUID(),
        title: command.title.trim(),
        opensAt: command.opensAt.toISOString(),
        closesAt: command.closesAt.toISOString(),
        tikkieUrl: command.tikkieUrl,
        publishedAt: null,
        archivedAt: null,
      },
      command.actorId,
    );
    return this.events.appendAndProject(event, (_stored, manager) =>
      this.projector.projectRound(event.payload, manager),
    );
  }
}

@CommandHandler(UpdateProtototoRoundCommand)
export class UpdateProtototoRoundHandler
  implements ICommandHandler<UpdateProtototoRoundCommand, ProtototoRoundEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: ProtototoProjector,
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
    const event = roundEvent(
      'protototo.round_saved',
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
    const saved = await this.events.appendAndProject(
      event,
      (_stored, manager) => this.projector.projectRound(event.payload, manager),
    );
    saved.matches = existing.matches;
    return saved;
  }
}

@CommandHandler(PublishProtototoRoundCommand)
export class PublishProtototoRoundHandler
  implements ICommandHandler<PublishProtototoRoundCommand, ProtototoRoundEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: ProtototoProjector,
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
    const event = roundEvent(
      'protototo.round_published',
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
    const saved = await this.events.appendAndProject(
      event,
      (_stored, manager) => this.projector.projectRound(event.payload, manager),
    );
    saved.matches = existing.matches;
    return saved;
  }
}

@CommandHandler(ArchiveProtototoRoundCommand)
export class ArchiveProtototoRoundHandler
  implements ICommandHandler<ArchiveProtototoRoundCommand, ProtototoRoundEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: ProtototoProjector,
    private readonly repository: ProtototoRepository,
  ) {}

  async execute(
    command: ArchiveProtototoRoundCommand,
  ): Promise<ProtototoRoundEntity> {
    const existing = await requireRound(this.repository, command.roundId);
    const event = roundEvent(
      'protototo.round_archived',
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
    const saved = await this.events.appendAndProject(
      event,
      (_stored, manager) => this.projector.projectRound(event.payload, manager),
    );
    saved.matches = existing.matches;
    return saved;
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
