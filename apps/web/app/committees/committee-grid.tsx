'use client';

import { AlertCircle, ImageIcon, Loader2 } from 'lucide-react';
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

  const visibleCommittees = [...(committees.data ?? [])]
    .filter(({ archivedAt }) => archivedAt === null)
    .sort((left, right) =>
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
              className="group overflow-hidden rounded-lg border bg-card text-card-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="aspect-[4/3] bg-muted">
                {committee.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={committee.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-8" />
                  </div>
                )}
              </div>
              <h2 className="p-4 text-lg font-semibold">{committee.name}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
