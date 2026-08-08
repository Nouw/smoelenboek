import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { ProtototoMatchEntity } from '../entities/protototo-match.entity';
import {
  ProtototoMatchRemovedEvent,
  ProtototoMatchSavedEvent,
} from '../events/protototo.events';
import { NevoboClient } from '../nevobo/nevobo.client';
import { ProtototoRepository } from '../repositories/protototo.repository';
import {
  AddProtototoMatchCommand,
  RemoveProtototoMatchCommand,
} from './protototo.commands';

@CommandHandler(AddProtototoMatchCommand)
export class AddProtototoMatchHandler
  implements ICommandHandler<AddProtototoMatchCommand, ProtototoMatchEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: ProtototoRepository,
    private readonly nevobo: NevoboClient,
  ) {}

  async execute(
    command: AddProtototoMatchCommand,
  ): Promise<ProtototoMatchEntity> {
    if (!(await this.repository.findRound(command.roundId))) {
      throw new NotFoundException('Protototo round not found.');
    }
    const [existing, snapshot] = await Promise.all([
      this.repository.findMatchByNevobo(command.roundId, command.nevoboMatchId),
      this.nevobo.getMatchSnapshot(
        command.selectedTeamIri,
        command.nevoboMatchId,
      ),
    ]);
    const matchId = existing?.id ?? randomUUID();
    const event = ProtototoMatchSavedEvent.create(
      {
        matchId,
        roundId: command.roundId,
        ...snapshot,
        startsAt: snapshot.startsAt.toISOString(),
        removedAt: null,
      },
      command.actorId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const match = await this.repository.findMatch(matchId);
    if (!match) throw new Error('Match projection missing after dispatch.');
    return match;
  }
}

@CommandHandler(RemoveProtototoMatchCommand)
export class RemoveProtototoMatchHandler
  implements ICommandHandler<RemoveProtototoMatchCommand, ProtototoMatchEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: ProtototoRepository,
  ) {}

  async execute(
    command: RemoveProtototoMatchCommand,
  ): Promise<ProtototoMatchEntity> {
    const match = await this.repository.findMatch(command.matchId);
    if (!match) throw new NotFoundException('Protototo match not found.');
    if (match.removedAt) return match;
    const event = ProtototoMatchRemovedEvent.create(
      {
        matchId: match.id,
        roundId: match.roundId,
        nevoboMatchId: match.nevoboMatchId,
        selectedTeamIri: match.selectedTeamIri,
        homeTeamIri: match.homeTeamIri,
        homeTeamName: match.homeTeamName,
        awayTeamIri: match.awayTeamIri,
        awayTeamName: match.awayTeamName,
        subjectSide: match.subjectSide,
        format: match.format,
        pointMethodIri: match.pointMethodIri,
        startsAt: match.startsAt.toISOString(),
        removedAt: new Date().toISOString(),
      },
      command.actorId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
    const removed = await this.repository.findMatch(command.matchId);
    if (!removed) throw new Error('Match projection missing after dispatch.');
    return removed;
  }
}
