'use client';

import type { CommitteeRole } from '@repo/api';
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
  RefreshCw,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';

import { useI18n, type TranslationKey } from '@/lib/i18n';
import { trpc } from '../../trpc';

const roleTranslationKeys = {
  commissielid: 'profile.roles.committeeMember',
  commissaris_externe_zaken: 'profile.roles.externalAffairs',
  wedstrijdsecretaris: 'profile.roles.matchSecretary',
  penningmeester: 'profile.roles.treasurer',
  commissaris_zaalwacht_en_arbitrage: 'profile.roles.refereeingOfficer',
  voorzitter: 'profile.roles.chair',
  secretaris: 'profile.roles.secretary',
} satisfies Record<CommitteeRole, TranslationKey>;

export function CommitteeDetail({ committeeId }: { committeeId: string }) {
  const { t } = useI18n();
  const roster = trpc.committees.currentRoster.useQuery(
    { committeeId },
    { retry: false },
  );

  if (roster.isLoading) {
    return <CommitteeDetailSkeleton />;
  }

  if (roster.isError) {
    return (
      <Card className="mx-auto max-w-xl shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">
              {t('committees.loadError')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {roster.error.message}
            </p>
          </div>
          <Button type="button" onClick={() => void roster.refetch()}>
            <RefreshCw />
            {t('committees.retry')}
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
          <h1 className="text-xl font-semibold">
            {t('committees.notFound')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('committees.notFoundDescription')}
          </p>
          <Button asChild variant="outline">
            <Link href="/committees">{t('committees.backToCommittees')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { committee, season, members } = roster.data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/committees">
          <ArrowLeft />
          {t('committees.backToCommittees')}
        </Link>
      </Button>

      <Card className="overflow-hidden bg-gradient-to-br from-primary/15 via-card to-card py-0 shadow-none">
        <CardContent className="flex min-h-64 flex-col justify-end gap-4 p-6 md:min-h-72 md:p-10">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>{t('committees.currentSeason')}</span>
              {committee.archivedAt ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {t('common.archived')}
                </span>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              {committee.name}
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              {season.label}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{t('committees.members')}</h2>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {members.length}
          </span>
        </div>
        {members.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed px-4 text-sm text-muted-foreground">
            {t('committees.noMembers')}
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
    </div>
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

function CommitteeDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8" aria-busy="true">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-7 w-32" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((member) => (
            <Skeleton key={member} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
