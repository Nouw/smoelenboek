'use client';

import { AlertCircle, ArrowLeft, Loader2, Medal, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { trpc } from '@/app/trpc';
import { useI18n } from '@/lib/i18n';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  DataTable,
  type DataTableColumnDef,
} from '@repo/ui/components/data-table';
import { normalizeRounds, normalizeStandings } from '../protototo-model';

export function StandingsContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const roundsQuery = trpc.protototo.memberRounds.useQuery(undefined, {
    retry: false,
  });
  const rounds = normalizeRounds(roundsQuery.data).filter(
    (round) =>
      new Date(round.closesAt) <= new Date() && round.status !== 'archived',
  );
  const requestedRoundId = searchParams.get('roundId');
  const roundId = requestedRoundId ?? rounds[0]?.id ?? '';
  const selectedRound = rounds.find(({ id }) => id === roundId);
  const standingsQuery = trpc.protototo.standings.useQuery(
    { roundId },
    { enabled: Boolean(roundId), retry: false },
  );
  const standings = normalizeStandings(standingsQuery.data);
  const standingColumns: DataTableColumnDef<(typeof standings)[number]>[] = [
    {
      accessorKey: 'rank',
      header: t('protototo.ranking'),
      cell: ({ row }) => (
        <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
          {row.original.rank <= 3 ? (
            <Medal className="size-4" aria-label={`${row.original.rank}`} />
          ) : (
            row.original.rank
          )}
        </span>
      ),
      meta: {
        headerClassName: 'w-10',
        cellClassName: 'w-10 pr-3',
      },
    },
    {
      accessorKey: 'displayName',
      header: t('protototo.admin.name'),
      cell: ({ row }) => (
        <span className="block min-w-0 truncate font-medium">
          {row.original.displayName}
        </span>
      ),
      meta: {
        cellClassName: 'max-w-0',
      },
    },
    {
      accessorKey: 'totalPoints',
      header: t('protototo.points'),
      cell: ({ row }) => (
        <span className="tabular-nums">
          <strong>{row.original.totalPoints}</strong>{' '}
          <span className="text-sm text-muted-foreground">
            {t('protototo.points')}
          </span>
        </span>
      ),
      meta: {
        headerClassName: 'w-24 text-right',
        cellClassName: 'w-24 pl-3 text-right',
      },
    },
  ];

  if (roundsQuery.isLoading || (roundId && standingsQuery.isLoading)) {
    return <State icon={Loader2} spin text={t('protototo.loadingStandings')} />;
  }

  const error = roundsQuery.error ?? standingsQuery.error;
  if (error) {
    return (
      <State
        icon={AlertCircle}
        text={t('protototo.standingsUnavailable')}
        detail={error.message}
      />
    );
  }

  if (!roundId || !selectedRound) {
    return <State icon={Trophy} text={t('protototo.noStandings')} />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-3">
          <Link href="/protototo">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('protototo.back')}
          </Link>
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('protototo.standings')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedRound.title}
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        aria-label={t('protototo.selectRound')}
      >
        {rounds.map((round) => (
          <Button
            key={round.id}
            asChild
            size="sm"
            variant={round.id === roundId ? 'default' : 'outline'}
          >
            <Link href={`/protototo/standings?roundId=${round.id}`}>
              {round.title}
            </Link>
          </Button>
        ))}
      </div>

      {standings.length === 0 ? (
        <State icon={Trophy} text={t('protototo.noStandings')} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('protototo.ranking')}</CardTitle>
            <CardDescription>
              {t('protototo.rankingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              caption={t('protototo.ranking')}
              columns={standingColumns}
              data={standings}
              getRowId={(standing, index) =>
                `${standing.rank}:${standing.displayName}:${index}`
              }
              presentation="compact"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function State({
  icon: Icon,
  spin = false,
  text,
  detail,
}: {
  icon: typeof Trophy;
  spin?: boolean;
  text: string;
  detail?: string;
}) {
  return (
    <div className="mx-auto flex min-h-64 w-full max-w-3xl flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
      <Icon
        className={`mb-3 size-6 text-muted-foreground ${spin ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <p className="font-medium">{text}</p>
      {detail ? (
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}
