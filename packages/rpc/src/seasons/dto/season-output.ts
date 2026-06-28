import type { SeasonDto } from '@repo/api';

import type { SeasonEntity } from '../entities/season.entity';

export function toSeasonDto(season: SeasonEntity): SeasonDto {
  return {
    id: season.id,
    name: season.name,
    startsAt: season.startsAt.toISOString(),
    endsAt: season.endsAt.toISOString(),
    createdAt: season.createdAt.toISOString(),
    updatedAt: season.updatedAt.toISOString(),
  };
}

