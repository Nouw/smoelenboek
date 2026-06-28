export type GeneratedSeason = {
  name: string;
  startsAt: Date;
  endsAt: Date;
};

export function generateDefaultSeason(startYear: number): GeneratedSeason {
  return {
    name: `${startYear}/${startYear + 1}`,
    startsAt: new Date(Date.UTC(startYear, 7, 1, 0, 0, 0, 0)),
    endsAt: new Date(Date.UTC(startYear + 1, 6, 31, 23, 59, 59, 999)),
  };
}

export function generateDefaultSeasons(
  startYear: number,
  endYear: number,
): GeneratedSeason[] {
  const seasons: GeneratedSeason[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    seasons.push(generateDefaultSeason(year));
  }

  return seasons;
}

