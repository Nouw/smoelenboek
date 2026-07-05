'use client';

import { AlertCircle, Loader2, UsersRound } from 'lucide-react';

import { trpc } from '../../trpc';

export default function MensTeamsPage() {
  const teams = trpc.teams.list.useQuery();

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

  const mensTeams =
    teams.data?.filter((team) => team.name.startsWith('Heren ')) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">Heren teams</h1>
        <p className="text-sm text-muted-foreground">
          Overzicht van alle heren teams in het huidige teamregister.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {mensTeams.map((team) => (
          <article
            key={team.id}
            className="flex items-center gap-3 rounded-lg border bg-card p-4 text-card-foreground"
          >
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent text-accent-foreground">
              {team.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <UsersRound className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium">{team.name}</h2>
              <p className="text-xs text-muted-foreground">
                {team.archivedAt ? 'Gearchiveerd' : 'Actief'}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
