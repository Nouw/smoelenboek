import type { SeasonDto } from '@repo/api';
import { randomUUID } from 'node:crypto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { toSeasonDto } from '../dto/season-output';
import { createSeasonGeneratedEvent } from '../events/season-events';
import { SeasonProjector } from '../projectors/season-projector';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { generateDefaultSeasons } from '../season-generator';
import { GenerateSeasonsCommand } from './generate-seasons.command';

@CommandHandler(GenerateSeasonsCommand)
export class GenerateSeasonsHandler
  implements ICommandHandler<GenerateSeasonsCommand, SeasonDto[]>
{
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly seasonProjector: SeasonProjector,
    private readonly seasonsRepository: SeasonsRepository,
  ) {}

  async execute(command: GenerateSeasonsCommand): Promise<SeasonDto[]> {
    const results: SeasonDto[] = [];

    for (const generated of generateDefaultSeasons(
      command.startYear,
      command.endYear,
    )) {
      const existing = await this.seasonsRepository.findByName(generated.name);

      if (existing) {
        results.push(toSeasonDto(existing));
        continue;
      }

      const event = createSeasonGeneratedEvent({
        seasonId: randomUUID(),
        name: generated.name,
        startsAt: generated.startsAt.toISOString(),
        endsAt: generated.endsAt.toISOString(),
      });
      const season = await this.eventStoreRepository.appendAndProject(
        event,
        (_storedEvent, manager) =>
          this.seasonProjector.projectSnapshot(event.payload, manager),
      );

      results.push(toSeasonDto(season));
    }

    return results;
  }
}

