import type { SeasonDto } from '@repo/api';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { toSeasonDto } from '../dto/season-output';
import { createSeasonUpdatedEvent } from '../events/season-events';
import { SeasonProjector } from '../projectors/season-projector';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { UpdateSeasonCommand } from './update-season.command';

@CommandHandler(UpdateSeasonCommand)
export class UpdateSeasonHandler
  implements ICommandHandler<UpdateSeasonCommand, SeasonDto>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly seasonProjector: SeasonProjector,
    private readonly seasonsRepository: SeasonsRepository,
  ) {}

  async execute(command: UpdateSeasonCommand): Promise<SeasonDto> {
    const existing = await this.seasonsRepository.findById(command.id);

    if (!existing) {
      throw new NotFoundException('Season not found.');
    }

    const event = createSeasonUpdatedEvent({
      seasonId: command.id,
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

