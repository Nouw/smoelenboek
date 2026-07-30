import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { ProtototoMatchEntity } from '../entities/protototo-match.entity';
import { matchEvent } from '../events/protototo.events';
import { NevoboClient } from '../nevobo/nevobo.client';
import { ProtototoProjector } from '../projectors/protototo.projector';
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
    private readonly events: EventStoreRepository,
    private readonly projector: ProtototoProjector,
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
    const event = matchEvent(
      'protototo.match_saved',
      {
        matchId: existing?.id ?? randomUUID(),
        roundId: command.roundId,
        ...snapshot,
        startsAt: snapshot.startsAt.toISOString(),
        removedAt: null,
      },
      command.actorId,
    );
    return this.events.appendAndProject(event, (_stored, manager) =>
      this.projector.projectMatch(event.payload, manager),
    );
  }
}

@CommandHandler(RemoveProtototoMatchCommand)
export class RemoveProtototoMatchHandler
  implements ICommandHandler<RemoveProtototoMatchCommand, ProtototoMatchEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: ProtototoProjector,
    private readonly repository: ProtototoRepository,
  ) {}

  async execute(
    command: RemoveProtototoMatchCommand,
  ): Promise<ProtototoMatchEntity> {
    const match = await this.repository.findMatch(command.matchId);
    if (!match) throw new NotFoundException('Protototo match not found.');
    if (match.removedAt) return match;
    const event = matchEvent(
      'protototo.match_removed',
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
    return this.events.appendAndProject(event, (_stored, manager) =>
      this.projector.projectMatch(event.payload, manager),
    );
  }
}
