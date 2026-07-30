'use client';

import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { useI18n } from '@/lib/i18n';
import { trpc } from '../trpc';

export function CommitteeGrid() {
  const { t } = useI18n();
  const committees = trpc.committees.list.useQuery();

  if (committees.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {t('committees.loading')}
      </div>
    );
  }

  if (committees.isError) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-sm text-destructive">
        <AlertCircle className="mr-2 size-4" />
        {committees.error.message}
      </div>
    );
  }

  const visibleCommittees = [...(committees.data ?? [])].sort((left, right) =>
    left.name.localeCompare(right.name, 'nl', { sensitivity: 'base' }),
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-normal">
        {t('committees.title')}
      </h1>

      {visibleCommittees.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed px-4 text-sm text-muted-foreground">
          {t('committees.empty')}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCommittees.map((committee) => (
            <Link
              key={committee.id}
              href={`/committees/${committee.id}`}
              className="group flex min-h-40 flex-col justify-between rounded-lg border bg-card p-5 text-card-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-lg bg-primary/10 p-3 text-primary">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </span>
                {committee.archivedAt ? (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {t('common.archived')}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-6 text-lg font-semibold">{committee.name}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
