import type { SeasonDto } from '@repo/api';
import { randomUUID } from 'node:crypto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { toSeasonDto } from '../dto/season-output';
import { createSeasonCreatedEvent } from '../events/season-events';
import { SeasonProjector } from '../projectors/season-projector';
import { CreateSeasonCommand } from './create-season.command';

@CommandHandler(CreateSeasonCommand)
export class CreateSeasonHandler
  implements ICommandHandler<CreateSeasonCommand, SeasonDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly seasonProjector: SeasonProjector,
  ) {}

  async execute(command: CreateSeasonCommand): Promise<SeasonDto> {
    const event = createSeasonCreatedEvent({
      seasonId: randomUUID(),
      name: command.name,
      startsAt: command.startsAt.toISOString(),
      endsAt: command.endsAt.toISOString(),
    });
    const season = await this.eventStoreRepository.appendAndProject(
      event,
      (_storedEvent, manager) =>
        this.seasonProjector.projectSnapshot(event.payload, manager),
    );

    return toSeasonDto(season);
  }
}

