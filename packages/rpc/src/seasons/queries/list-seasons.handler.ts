import type { SeasonDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CommitteesRepository } from '../../committees/repositories/committees.repository';
import { TeamsRepository } from '../../teams/repositories/teams.repository';
import { getSeason, getSeasonKey } from '../season-policy';
import { ListSeasonsQuery } from './list-seasons.query';

@QueryHandler(ListSeasonsQuery)
export class ListSeasonsHandler
  implements IQueryHandler<ListSeasonsQuery, SeasonDto[]>
{
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly committeesRepository: CommitteesRepository,
  ) {}

  async execute(): Promise<SeasonDto[]> {
    const [teamSeasonKeys, committeeSeasonKeys] = await Promise.all([
      this.teamsRepository.findSeasonKeys(),
      this.committeesRepository.findSeasonKeys(),
    ]);
    const currentSeasonKey = getSeasonKey(new Date());
    const seasonKeys = new Set([
      ...teamSeasonKeys,
      ...committeeSeasonKeys,
      currentSeasonKey,
      currentSeasonKey + 1,
    ]);

    return [...seasonKeys].sort((left, right) => right - left).map(getSeason);
  }
}
