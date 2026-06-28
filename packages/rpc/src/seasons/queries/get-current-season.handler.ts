import type { SeasonDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toSeasonDto } from '../dto/season-output';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { GetCurrentSeasonQuery } from './get-current-season.query';

@QueryHandler(GetCurrentSeasonQuery)
export class GetCurrentSeasonHandler
  implements IQueryHandler<GetCurrentSeasonQuery, SeasonDto | null>
{
  constructor(private readonly seasonsRepository: SeasonsRepository) {}

  async execute(query: GetCurrentSeasonQuery): Promise<SeasonDto | null> {
    const season = await this.seasonsRepository.findCurrent(query.at);

    return season ? toSeasonDto(season) : null;
  }
}

