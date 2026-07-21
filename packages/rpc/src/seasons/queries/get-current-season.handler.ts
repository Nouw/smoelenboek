import type { SeasonDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { getSeasonForDate } from '../season-policy';
import { GetCurrentSeasonQuery } from './get-current-season.query';

@QueryHandler(GetCurrentSeasonQuery)
export class GetCurrentSeasonHandler
  implements IQueryHandler<GetCurrentSeasonQuery, SeasonDto>
{
  async execute(query: GetCurrentSeasonQuery): Promise<SeasonDto> {
    return getSeasonForDate(query.at);
  }
}
