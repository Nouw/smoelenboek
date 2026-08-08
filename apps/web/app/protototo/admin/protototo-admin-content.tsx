'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

import { trpc } from '@/app/trpc';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  DataTable,
  type DataTableColumnDef,
} from '@repo/ui/components/data-table';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  entriesToCsv,
  formatDateTime,
  normalizeEntries,
  normalizeRound,
  normalizeRounds,
  type ProtototoRound,
} from '../protototo-model';

type NevoboTeam = { id: string; name: string };
type NevoboMatch = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  startsAt: string;
};

export function ProtototoAdminContent({ roundId }: { roundId?: string }) {
  const { t } = useI18n();
  const currentUser = useCurrentUser();
  const selectedRoundId = roundId ?? '';
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listRounds = trpc.protototo.admin.listRounds.useQuery(undefined, {
    enabled: currentUser.isAdmin,
    retry: false,
  });
  const rounds = normalizeRounds(listRounds.data);
  const roundQuery = trpc.protototo.admin.getRound.useQuery(
    { roundId: selectedRoundId },
    { enabled: currentUser.isAdmin && Boolean(selectedRoundId), retry: false },
  );
  const selectedRound = normalizeRound(roundQuery.data);
  const teamsQuery = trpc.protototo.admin.listNevoboTeams.useQuery(undefined, {
    enabled: currentUser.isAdmin && Boolean(selectedRoundId),
    retry: false,
  });
  const teams = normalizeNevoboTeams(teamsQuery.data);
  const nevoboMatchesQuery = trpc.protototo.admin.listNevoboMatches.useQuery(
    { selectedTeamIri: selectedTeamId },
    { enabled: currentUser.isAdmin && Boolean(selectedTeamId), retry: false },
  );
  const nevoboMatches = normalizeNevoboMatches(nevoboMatchesQuery.data);
  const entriesQuery = trpc.protototo.admin.listEntries.useQuery(
    { roundId: selectedRoundId },
    { enabled: currentUser.isAdmin && Boolean(selectedRoundId), retry: false },
  );
  const entries = normalizeEntries(entriesQuery.data);
  const utils = trpc.useUtils();

  const refreshRound = async () => {
    await Promise.all([
      utils.protototo.admin.listRounds.invalidate(),
      utils.protototo.admin.getRound.invalidate(),
      utils.protototo.admin.listEntries.invalidate(),
      utils.protototo.current.invalidate(),
      utils.protototo.memberRounds.invalidate(),
    ]);
  };

  function mutationOptions(successMessage: string) {
    return {
      async onSuccess() {
        setNotice(successMessage);
        setActionError(null);
        await refreshRound();
      },
      onError(error: { message: string }) {
        setNotice(null);
        setActionError(error.message);
      },
    };
  }

  const createRound = trpc.protototo.admin.createRound.useMutation(
    mutationOptions(t('protototo.admin.roundCreated')),
  );
  const updateRound = trpc.protototo.admin.updateRound.useMutation(
    mutationOptions(t('protototo.admin.roundUpdated')),
  );
  const publishRound = trpc.protototo.admin.publishRound.useMutation(
    mutationOptions(t('protototo.admin.roundPublished')),
  );
  const archiveRound = trpc.protototo.admin.archiveRound.useMutation(
    mutationOptions(t('protototo.admin.roundArchived')),
  );
  const addMatch = trpc.protototo.admin.addMatch.useMutation(
    mutationOptions(t('protototo.admin.matchAdded')),
  );
  const removeMatch = trpc.protototo.admin.removeMatch.useMutation(
    mutationOptions(t('protototo.admin.matchRemoved')),
  );
  const syncResults = trpc.protototo.admin.syncResults.useMutation({
    async onSuccess(result) {
      const summary = normalizeSyncSummary(result);
      setNotice(
        `${t('protototo.admin.syncComplete')}: ${summary.final} ${t('protototo.admin.final')}, ${summary.pending} ${t('protototo.admin.pending')}, ${summary.cancelled} ${t('protototo.admin.cancelled')}, ${summary.failed} ${t('protototo.admin.failed')}.`,
      );
      setActionError(null);
      await refreshRound();
    },
    onError(error) {
      setNotice(null);
      setActionError(error.message);
    },
  });

  if (currentUser.isLoading) {
    return (
      <AdminState icon={Loader2} spin text={t('protototo.admin.loading')} />
    );
  }
  if (!currentUser.isAdmin) {
    return (
      <AdminState
        icon={ShieldAlert}
        text={t('protototo.admin.forbidden')}
        detail={t('protototo.admin.forbiddenDescription')}
      />
    );
  }

  function submitCreateRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = roundFormValues(new FormData(event.currentTarget));
    if (!values) {
      setActionError(t('protototo.admin.invalidRound'));
      return;
    }
    createRound.mutate(values);
  }

  function submitUpdateRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = roundFormValues(new FormData(event.currentTarget));
    if (!values || !selectedRound) {
      setActionError(t('protototo.admin.invalidRound'));
      return;
    }
    updateRound.mutate({ roundId: selectedRound.id, ...values });
  }

  const anyActionPending = [
    createRound,
    updateRound,
    publishRound,
    archiveRound,
    addMatch,
    removeMatch,
    syncResults,
  ].some(({ isPending }) => isPending);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('protototo.admin.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('protototo.admin.description')}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/protototo">
            {t('protototo.admin.openParticipantPage')}
          </Link>
        </Button>
      </header>

      {actionError ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {actionError}
        </div>
      ) : null}
      {notice ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      ) : null}

      {!selectedRoundId ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <RoundsCard
            rounds={rounds}
            loading={listRounds.isLoading}
            error={listRounds.error?.message}
          />
          <CreateRoundCard
            onSubmit={submitCreateRound}
            pending={createRound.isPending}
          />
        </div>
      ) : (
        <main className="min-w-0 space-y-6">
          <Button asChild variant="ghost" className="-ml-3">
            <Link href="/protototo/admin">
              <ArrowLeft className="size-4" />
              {t('protototo.admin.backToRounds')}
            </Link>
          </Button>
          {roundQuery.isLoading ? (
            <AdminState
              icon={Loader2}
              spin
              text={t('protototo.admin.loadingRound')}
            />
          ) : roundQuery.isError ? (
            <AdminState icon={AlertCircle} text={roundQuery.error.message} />
          ) : !selectedRound ? (
            <AdminState
              icon={AlertCircle}
              text={t('protototo.admin.roundNotFound')}
            />
          ) : (
            <>
              <RoundSettings
                key={selectedRound.id}
                round={selectedRound}
                onSubmit={submitUpdateRound}
                onPublish={() =>
                  publishRound.mutate({ roundId: selectedRound.id })
                }
                onArchive={() =>
                  archiveRound.mutate({ roundId: selectedRound.id })
                }
                onSync={() => syncResults.mutate({ roundId: selectedRound.id })}
                pending={anyActionPending}
              />
              <RoundMatches
                round={selectedRound}
                teams={teams}
                selectedTeamId={selectedTeamId}
                onTeamChange={setSelectedTeamId}
                nevoboMatches={nevoboMatches}
                loadingTeams={teamsQuery.isLoading}
                loadingMatches={nevoboMatchesQuery.isLoading}
                loadError={
                  teamsQuery.error?.message ?? nevoboMatchesQuery.error?.message
                }
                pending={addMatch.isPending || removeMatch.isPending}
                onAdd={(nevoboMatchId) =>
                  addMatch.mutate({
                    roundId: selectedRound.id,
                    selectedTeamIri: selectedTeamId,
                    nevoboMatchId,
                  })
                }
                onRemove={(matchId) => removeMatch.mutate({ matchId })}
              />
              <EntriesCard
                round={selectedRound}
                entries={entries}
                loading={entriesQuery.isLoading}
                error={entriesQuery.error?.message}
              />
            </>
          )}
        </main>
      )}
    </div>
  );
}

function RoundsCard({
  rounds,
  loading,
  error,
}: {
  rounds: ProtototoRound[];
  loading: boolean;
  error?: string;
}) {
  const { locale, t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('protototo.admin.rounds')}</CardTitle>
        <CardDescription>{t('protototo.admin.selectRound')}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <InlineLoading text={t('protototo.admin.loadingRounds')} />
        ) : error ? (
          <InlineError text={error} />
        ) : rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('protototo.admin.noRounds')}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rounds.map((round) => (
              <li key={round.id}>
                <Link
                  href={`/protototo/admin/${round.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{round.title}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {t(`protototo.admin.status.${round.status}`)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTime(round.opensAt, locale)} ·{' '}
                      {
                        round.matches.filter(({ removedAt }) => !removedAt)
                          .length
                      }{' '}
                      {t('protototo.admin.matchesCount')}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CreateRoundCard({
  onSubmit,
  pending,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('protototo.admin.newRound')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <RoundFields />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {t('protototo.admin.create')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RoundSettings({
  round,
  onSubmit,
  onPublish,
  onArchive,
  onSync,
  pending,
}: {
  round: ProtototoRound;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPublish: () => void;
  onArchive: () => void;
  onSync: () => void;
  pending: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{round.title}</CardTitle>
            <CardDescription>
              {t(`protototo.admin.status.${round.status}`)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSync}
              disabled={pending}
            >
              <RefreshCw className="size-4" />
              {t('protototo.admin.sync')}
            </Button>
            {round.status === 'draft' ||
            round.status === 'closed' ||
            round.status === 'archived' ? (
              <Button type="button" onClick={onPublish} disabled={pending}>
                {t('protototo.admin.publish')}
              </Button>
            ) : null}
            {round.status !== 'archived' ? (
              <Button
                type="button"
                variant="outline"
                onClick={onArchive}
                disabled={pending}
              >
                <Archive className="size-4" />
                {t('protototo.admin.archive')}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <RoundFields round={round} />
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {t('protototo.admin.saveRound')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function RoundFields({ round }: { round?: ProtototoRound }) {
  const { t } = useI18n();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={round ? 'edit-round-title' : 'new-round-title'}>
          {t('protototo.admin.roundTitle')}
        </Label>
        <Input
          id={round ? 'edit-round-title' : 'new-round-title'}
          name="title"
          defaultValue={round?.title}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={round ? 'edit-round-opens' : 'new-round-opens'}>
          {t('protototo.admin.opensAt')}
        </Label>
        <Input
          id={round ? 'edit-round-opens' : 'new-round-opens'}
          name="opensAt"
          type="datetime-local"
          defaultValue={round ? toLocalInput(round.opensAt) : ''}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={round ? 'edit-round-closes' : 'new-round-closes'}>
          {t('protototo.admin.closesAt')}
        </Label>
        <Input
          id={round ? 'edit-round-closes' : 'new-round-closes'}
          name="closesAt"
          type="datetime-local"
          defaultValue={round ? toLocalInput(round.closesAt) : ''}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={round ? 'edit-round-tikkie' : 'new-round-tikkie'}>
          {t('protototo.admin.tikkieUrl')}
        </Label>
        <Input
          id={round ? 'edit-round-tikkie' : 'new-round-tikkie'}
          name="tikkieUrl"
          type="url"
          defaultValue={round?.tikkieUrl ?? ''}
          placeholder="https://tikkie.me/pay/..."
        />
      </div>
    </>
  );
}

function RoundMatches({
  round,
  teams,
  selectedTeamId,
  onTeamChange,
  nevoboMatches,
  loadingTeams,
  loadingMatches,
  loadError,
  pending,
  onAdd,
  onRemove,
}: {
  round: ProtototoRound;
  teams: NevoboTeam[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
  nevoboMatches: NevoboMatch[];
  loadingTeams: boolean;
  loadingMatches: boolean;
  loadError?: string;
  pending: boolean;
  onAdd: (nevoboMatchId: string) => void;
  onRemove: (matchId: string) => void;
}) {
  const { locale, t } = useI18n();
  const activeMatches = round.matches.filter(({ removedAt }) => !removedAt);
  const existingIds = useMemo(
    () => new Set(activeMatches.map(({ nevoboMatchId }) => nevoboMatchId)),
    [activeMatches],
  );
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('protototo.admin.roundMatches')}</CardTitle>
          <CardDescription>
            {t('protototo.admin.roundMatchesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('protototo.admin.noMatches')}
            </p>
          ) : (
            <ul className="divide-y">
              {activeMatches.map((match) => (
                <li
                  key={match.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {match.homeTeamName} – {match.awayTeamName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(match.startsAt, locale)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={pending}
                    aria-label={t('protototo.admin.removeMatch')}
                    onClick={() => onRemove(match.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('protototo.admin.nevoboMatches')}</CardTitle>
          <CardDescription>
            {t('protototo.admin.nevoboDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingTeams ? (
            <InlineLoading text={t('protototo.admin.loadingTeams')} />
          ) : loadError ? (
            <InlineError text={loadError} />
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nevobo-team">{t('protototo.admin.team')}</Label>
                <select
                  id="nevobo-team"
                  value={selectedTeamId}
                  onChange={(event) => onTeamChange(event.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t('protototo.admin.chooseTeam')}</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              {loadingMatches ? (
                <InlineLoading text={t('protototo.admin.loadingMatches')} />
              ) : selectedTeamId && nevoboMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('protototo.admin.noNevoboMatches')}
                </p>
              ) : (
                <ul className="max-h-80 divide-y overflow-y-auto">
                  {nevoboMatches.map((match) => {
                    const added = existingIds.has(match.id);
                    return (
                      <li
                        key={match.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {match.homeTeamName} – {match.awayTeamName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(match.startsAt, locale)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending || added}
                          onClick={() => onAdd(match.id)}
                        >
                          {added
                            ? t('protototo.admin.added')
                            : t('protototo.admin.add')}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EntriesCard({
  round,
  entries,
  loading,
  error,
}: {
  round: ProtototoRound;
  entries: ReturnType<typeof normalizeEntries>;
  loading: boolean;
  error?: string;
}) {
  const { locale, t } = useI18n();
  const entryColumns: DataTableColumnDef<(typeof entries)[number]>[] = [
    {
      accessorKey: 'displayName',
      header: t('protototo.admin.name'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.displayName}</span>
      ),
    },
    {
      accessorKey: 'participantType',
      header: t('protototo.admin.type'),
      cell: ({ row }) =>
        t(`protototo.admin.participantType.${row.original.participantType}`),
    },
    {
      accessorKey: 'email',
      header: t('protototo.email'),
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      id: 'paid',
      header: t('protototo.admin.paid'),
      cell: ({ row }) =>
        row.original.participantType === 'member'
          ? t('protototo.admin.notApplicable')
          : row.original.paymentClaimed
            ? t('protototo.admin.yes')
            : t('protototo.admin.no'),
    },
    {
      accessorKey: 'updatedAt',
      header: t('protototo.admin.updated'),
      cell: ({ row }) =>
        row.original.updatedAt
          ? formatDateTime(row.original.updatedAt, locale)
          : '—',
    },
    {
      accessorKey: 'totalPoints',
      header: t('protototo.admin.score'),
      cell: ({ row }) => row.original.totalPoints,
      meta: {
        headerClassName: 'text-right',
        cellClassName: 'text-right font-semibold tabular-nums',
      },
    },
  ];

  function downloadCsv() {
    const csv = entriesToCsv(
      entries,
      round.matches.filter(({ removedAt }) => !removedAt),
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `protototo-${round.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t('protototo.admin.entries')}</CardTitle>
            <CardDescription>
              {entries.length} {t('protototo.admin.entriesCount')}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={downloadCsv}
            disabled={entries.length === 0}
          >
            <Download className="size-4" />
            {t('protototo.admin.downloadCsv')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <InlineLoading text={t('protototo.admin.loadingEntries')} />
        ) : error ? (
          <InlineError text={error} />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('protototo.admin.noEntries')}
          </p>
        ) : (
          <DataTable
            caption={t('protototo.admin.entries')}
            className="min-w-[44rem]"
            columns={entryColumns}
            data={entries}
            getRowId={(entry) => entry.id}
            presentation="scroll"
          />
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {t('protototo.admin.csvDescription')}
      </CardFooter>
    </Card>
  );
}

function InlineLoading({ text }: { text: string }) {
  return (
    <p
      className="flex items-center gap-2 text-sm text-muted-foreground"
      role="status"
    >
      <Loader2 className="size-4 animate-spin" /> {text}
    </p>
  );
}

function InlineError({ text }: { text: string }) {
  return (
    <p className="text-sm text-destructive" role="alert">
      {text}
    </p>
  );
}

function AdminState({
  icon: Icon,
  spin = false,
  text,
  detail,
}: {
  icon: typeof Plus;
  spin?: boolean;
  text: string;
  detail?: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
      <Icon
        className={`mb-3 size-6 text-muted-foreground ${spin ? 'animate-spin' : ''}`}
      />
      <p className="font-medium">{text}</p>
      {detail ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}

function roundFormValues(data: FormData) {
  const title = data.get('title');
  const opensAt = data.get('opensAt');
  const closesAt = data.get('closesAt');
  const tikkieUrl = data.get('tikkieUrl');
  if (
    typeof title !== 'string' ||
    typeof opensAt !== 'string' ||
    typeof closesAt !== 'string' ||
    !title.trim() ||
    !opensAt ||
    !closesAt
  )
    return null;
  const opens = parseAmsterdamDateTime(opensAt);
  const closes = parseAmsterdamDateTime(closesAt);
  if (!opens || !closes) return null;
  return {
    title: title.trim(),
    opensAt: opens.toISOString(),
    closesAt: closes.toISOString(),
    tikkieUrl:
      typeof tikkieUrl === 'string' && tikkieUrl.trim()
        ? tikkieUrl.trim()
        : null,
  };
}

function toLocalInput(value: string): string {
  const date = new Date(value);
  const parts = amsterdamDateTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function parseAmsterdamDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const wallTimeUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  let instant = new Date(wallTimeUtc);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    instant = new Date(wallTimeUtc - amsterdamOffsetMs(instant));
  }
  return toLocalInput(instant.toISOString()) === value ? instant : null;
}

function amsterdamOffsetMs(date: Date): number {
  const parts = amsterdamDateTimeParts(date);
  return (
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    ) - date.getTime()
  );
}

function amsterdamDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return {
    year: values.year ?? '',
    month: values.month ?? '',
    day: values.day ?? '',
    hour: values.hour ?? '',
    minute: values.minute ?? '',
  };
}

function normalizeNevoboTeams(value: unknown): NevoboTeam[] {
  const items = extractItems(value, 'teams');
  return items
    .map((item) => {
      if (!isObject(item)) return null;
      const id = stringValue(item.id) ?? stringValue(item.nevoboTeamId);
      const name = stringValue(item.name);
      return id && name ? { id, name } : null;
    })
    .filter((item): item is NevoboTeam => item !== null);
}

function normalizeNevoboMatches(value: unknown): NevoboMatch[] {
  const items = extractItems(value, 'matches');
  return items
    .map((item) => {
      if (!isObject(item)) return null;
      const id = stringValue(item.id) ?? stringValue(item.nevoboMatchId);
      const homeTeamName =
        stringValue(item.homeTeamName) ?? stringValue(item.homeTeam);
      const awayTeamName =
        stringValue(item.awayTeamName) ?? stringValue(item.awayTeam);
      const startsAt =
        stringValue(item.startsAt) ?? stringValue(item.startTime);
      if (!id || !homeTeamName || !awayTeamName || !startsAt) return null;
      return { id, homeTeamName, awayTeamName, startsAt };
    })
    .filter((item): item is NevoboMatch => item !== null);
}

function normalizeSyncSummary(value: unknown) {
  const source = isObject(value) ? value : {};
  return {
    final: numberValue(source.final),
    pending: numberValue(source.pending),
    cancelled: numberValue(source.cancelled),
    failed: numberValue(source.failed),
  };
}

function extractItems(value: unknown, key: string): unknown[] {
  if (Array.isArray(value)) return value;
  return isObject(value) && Array.isArray(value[key]) ? value[key] : [];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
