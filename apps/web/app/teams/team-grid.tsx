'use client';

import { AlertCircle, ImageIcon, Loader2 } from 'lucide-react';
import { trpc } from '../trpc';
import { isMensTeam, isWomensTeam } from './team-filters';

type TeamGridProps = {
  gender: 'men' | 'women';
};

const pageCopy = {
  men: {
    title: 'Heren teams',
    description: 'Overzicht van alle heren teams.',
    empty: 'Geen heren teams gevonden.',
  },
  women: {
    title: 'Dames teams',
    description: 'Overzicht van alle dames teams.',
    empty: 'Geen dames teams gevonden.',
  },
} satisfies Record<
  TeamGridProps['gender'],
  { title: string; description: string; empty: string }
>;

export function TeamGrid({ gender }: TeamGridProps) {
  const teams = trpc.teams.list.useQuery();
  const copy = pageCopy[gender];

  if (teams.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Teams laden
      </div>
    );
  }

  if (teams.isError) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-sm text-destructive">
        <AlertCircle className="mr-2 size-4" />
        {teams.error.message}
      </div>
    );
  }

  const visibleTeams =
    teams.data?.filter(gender === 'men' ? isMensTeam : isWomensTeam) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </div>

      {visibleTeams.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed px-4 text-sm text-muted-foreground">
          {copy.empty}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTeams.map((team) => (
            <article
              key={team.id}
              className="overflow-hidden rounded-lg border bg-card text-card-foreground"
            >
              <div className="aspect-[4/3] bg-muted">
                {team.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={team.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-8" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <h2 className="min-w-0 truncate text-base font-semibold">
                  {team.name}
                </h2>
                {team.archivedAt ? (
                  <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Archief
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
