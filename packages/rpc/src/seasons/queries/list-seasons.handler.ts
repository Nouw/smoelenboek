import type { SeasonDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toSeasonDto } from '../dto/season-output';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { ListSeasonsQuery } from './list-seasons.query';

@QueryHandler(ListSeasonsQuery)
export class ListSeasonsHandler
  implements IQueryHandler<ListSeasonsQuery, SeasonDto[]>
{
  constructor(private readonly seasonsRepository: SeasonsRepository) {}

  async execute(): Promise<SeasonDto[]> {
    const seasons = await this.seasonsRepository.findAll();

    return seasons.map(toSeasonDto);
  }
}

