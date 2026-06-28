import type { SeasonDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toSeasonDto } from '../dto/season-output';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { GetSeasonQuery } from './get-season.query';

@QueryHandler(GetSeasonQuery)
export class GetSeasonHandler
  implements IQueryHandler<GetSeasonQuery, SeasonDto | null>
{
  constructor(private readonly seasonsRepository: SeasonsRepository) {}

  async execute(query: GetSeasonQuery): Promise<SeasonDto | null> {
    const season = await this.seasonsRepository.findById(query.id);

    return season ? toSeasonDto(season) : null;
  }
}

