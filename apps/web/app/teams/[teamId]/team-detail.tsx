'use client';

import type { TeamRole } from '@repo/api';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import {
  AlertCircle,
  ArrowLeft,
  ImageIcon,
  RefreshCw,
  UserRound,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';

import { useI18n, type TranslationKey } from '@/lib/i18n';
import { trpc } from '../../trpc';

const roleTranslationKeys = {
  libero: 'profile.roles.libero',
  middle: 'profile.roles.middle',
  coach_trainer: 'profile.roles.coachTrainer',
  setter: 'profile.roles.setter',
  outside_hitter: 'profile.roles.outsideHitter',
  opposite_hitter: 'profile.roles.oppositeHitter',
} satisfies Record<TeamRole, TranslationKey>;

export function TeamDetail({ teamId }: { teamId: string }) {
  const { t } = useI18n();
  const roster = trpc.teams.currentRoster.useQuery(
    { teamId },
    { retry: false },
  );

  if (roster.isLoading) {
    return <TeamDetailSkeleton />;
  }

  if (roster.isError) {
    return (
      <Card className="mx-auto max-w-xl shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">{t('teams.loadError')}</h1>
            <p className="text-sm text-muted-foreground">
              {roster.error.message}
            </p>
          </div>
          <Button type="button" onClick={() => void roster.refetch()}>
            <RefreshCw />
            {t('teams.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!roster.data) {
    return (
      <Card className="mx-auto max-w-xl shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
          <UsersRound className="size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t('teams.notFound')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('teams.notFoundDescription')}
          </p>
          <Button asChild variant="outline">
            <Link href="/teams/men">{t('teams.backToTeams')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { team, season, coaches, players } = roster.data;
  const teamsHref = team.name.startsWith('Dames ')
    ? '/teams/women'
    : '/teams/men';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={teamsHref}>
          <ArrowLeft />
          {t('teams.backToTeams')}
        </Link>
      </Button>

      <Card className="relative min-h-72 overflow-hidden p-0 text-white shadow-none md:min-h-[26rem]">
        {team.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-950 text-white/40">
            <ImageIcon className="size-14" aria-hidden="true" />
            <span className="sr-only">{t('teams.noTeamImage')}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
        <div className="relative flex min-h-72 flex-col justify-end gap-2 p-6 md:min-h-[26rem] md:p-10">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white/80">
            <span>{t('teams.currentSeason')}</span>
            {team.archivedAt ? (
              <span className="rounded-full border border-white/30 bg-black/20 px-2.5 py-1 text-xs text-white">
                {t('common.archived')}
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
            {team.name}
          </h1>
          <p className="text-base text-white/80 md:text-lg">{season.label}</p>
        </div>
      </Card>

      <RosterSection
        title={t('teams.coaches')}
        empty={t('teams.noCoaches')}
        members={coaches}
      />
      <RosterSection
        title={t('teams.players')}
        empty={t('teams.noPlayers')}
        members={players}
      />
    </div>
  );
}

type RosterMember = {
  userId: string;
  name: string;
  imageUrl: string | null;
  role: TeamRole;
};

function RosterSection({
  title,
  empty,
  members,
}: {
  title: string;
  empty: string;
  members: RosterMember[];
}) {
  const { t } = useI18n();

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {members.length}
        </span>
      </div>
      {members.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed px-4 text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Link
              key={`${member.userId}:${member.role}`}
              href={`/profile/${member.userId}`}
              aria-label={`${member.name}, ${t(roleTranslationKeys[member.role])}`}
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full py-4 shadow-none transition-colors hover:border-foreground/30">
                <CardContent className="flex items-center gap-4 px-4">
                  <Avatar className="size-14">
                    <AvatarImage
                      src={member.imageUrl ?? undefined}
                      alt={member.name}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {initials(member.name) || <UserRound />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{member.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t(roleTranslationKeys[member.role])}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function TeamDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8" aria-busy="true">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-80 w-full rounded-xl" />
      {[0, 1].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-7 w-32" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((member) => (
              <Skeleton key={member} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
