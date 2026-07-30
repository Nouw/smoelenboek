'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

import { trpc } from '@/app/trpc';
import { authClient } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  formatDateTime,
  isPredictionComplete,
  normalizeEntry,
  normalizeRound,
  normalizeRounds,
  opponentTeamName,
  participantTeamName,
  predictionSetCount,
  roundIsOpen,
  type ProtototoEntry,
  type ProtototoMatch,
  type ProtototoPrediction,
} from './protototo-model';

type PickState = Record<string, Array<boolean | null>>;

export function ProtototoContent() {
  const { locale, t } = useI18n();
  const session = authClient.useSession();
  const signedIn = Boolean(session.data?.user);
  const currentQuery = trpc.protototo.current.useQuery();
  const memberRoundsQuery = trpc.protototo.memberRounds.useQuery(undefined, {
    enabled: signedIn,
    retry: false,
  });
  const round = normalizeRound(currentQuery.data);
  const memberRounds = normalizeRounds(memberRoundsQuery.data);

  if (currentQuery.isLoading || session.isPending) {
    return <PageState icon={Loader2} spin text={t('protototo.loading')} />;
  }

  if (currentQuery.isError) {
    return (
      <PageState
        icon={AlertCircle}
        text={t('protototo.loadError')}
        detail={currentQuery.error.message}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => currentQuery.refetch()}
          >
            {t('protototo.retry')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="overflow-hidden rounded-xl border bg-card">
        <div className="grid gap-6 px-5 py-7 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {round?.title ?? t('protototo.title')}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {t('protototo.description')}
              </p>
            </div>
          </div>
          {round ? (
            <div className="rounded-lg bg-muted px-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Clock3 className="size-4" aria-hidden="true" />
                {roundIsOpen(round)
                  ? t('protototo.openUntil')
                  : t('protototo.closedAt')}
              </span>
              <span className="mt-1 block text-muted-foreground">
                {formatDateTime(round.closesAt, locale)}
              </span>
            </div>
          ) : null}
        </div>
      </header>

      {!round ? (
        <PageState icon={Trophy} text={t('protototo.noRound')} />
      ) : round.matches.length === 0 ? (
        <PageState icon={Clock3} text={t('protototo.noMatches')} />
      ) : !roundIsOpen(round) ? (
        <ClosedRound
          signedIn={signedIn}
          roundId={round.id}
          memberRounds={memberRounds}
        />
      ) : (
        <EntryForm round={round} signedIn={signedIn} />
      )}

      {signedIn && memberRounds.length > 0 ? (
        <RoundHistory rounds={memberRounds} />
      ) : null}
    </div>
  );
}

function EntryForm({
  round,
  signedIn,
}: {
  round: NonNullable<ReturnType<typeof normalizeRound>>;
  signedIn: boolean;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymousLookupAttempted, setAnonymousLookupAttempted] =
    useState(false);
  const [paymentClaimed, setPaymentClaimed] = useState(false);
  const [tikkieOpened, setTikkieOpened] = useState(false);
  const [picks, setPicks] = useState<PickState>(() =>
    emptyPicks(round.matches),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const memberEntryQuery = trpc.protototo.myEntry.useQuery(
    { roundId: round.id },
    { enabled: signedIn, retry: false },
  );
  const anonymousEntryLookup =
    trpc.protototo.lookupAnonymousEntry.useMutation();
  const submitEntry = trpc.protototo.submitEntry.useMutation({
    onSuccess(data) {
      const entry = normalizeEntry(data);
      if (entry) populateEntry(entry);
      setSaved(true);
      setFormError(null);
    },
    onError(error) {
      setSaved(false);
      setFormError(error.message);
    },
  });

  function populateEntry(entry: ProtototoEntry) {
    setPicks(picksFromEntry(round.matches, entry));
    if (!signedIn) setPaymentClaimed(entry.paymentClaimed);
  }

  useEffect(() => {
    const entry = normalizeEntry(memberEntryQuery.data);
    if (entry) {
      setPicks(picksFromEntry(round.matches, entry));
    }
  }, [memberEntryQuery.data, round.matches]);

  useEffect(() => {
    const entry = normalizeEntry(anonymousEntryLookup.data);
    if (entry) {
      setPicks(picksFromEntry(round.matches, entry));
      setPaymentClaimed(entry.paymentClaimed);
    }
  }, [anonymousEntryLookup.data, round.matches]);

  const predictions = useMemo(
    () => predictionsFromPicks(round.matches, picks),
    [picks, round.matches],
  );
  const predictionsComplete = predictions.every((prediction) => {
    const match = round.matches.find(({ id }) => id === prediction.matchId);
    return Boolean(
      match && isPredictionComplete(match.format, prediction.setWinners),
    );
  });
  const isLoadingEntry = signedIn
    ? memberEntryQuery.isLoading
    : anonymousEntryLookup.isPending;

  function chooseWinner(
    match: ProtototoMatch,
    setIndex: number,
    winner: boolean,
  ) {
    setSaved(false);
    setPicks((current) => {
      const next = [...(current[match.id] ?? [])];
      next[setIndex] = winner;
      const firstMissing = next.findIndex((pick) => pick === null);
      const contiguous =
        firstMissing === -1 ? next : next.slice(0, firstMissing);
      const setCount = visibleSetCount(match, contiguous);
      return { ...current, [match.id]: next.slice(0, setCount) };
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    if (!predictionsComplete || predictions.length !== round.matches.length) {
      setFormError(t('protototo.completePredictions'));
      return;
    }
    if (!signedIn && (!firstName.trim() || !email.trim())) {
      setFormError(t('protototo.identityRequired'));
      return;
    }
    if (!signedIn && round.tikkieUrl && (!tikkieOpened || !paymentClaimed)) {
      setFormError(t('protototo.paymentRequired'));
      return;
    }

    submitEntry.mutate({
      roundId: round.id,
      ...(signedIn
        ? {}
        : {
            firstName: firstName.trim(),
            email: email.trim(),
            paymentClaimed,
          }),
      predictions,
    });
  }

  function loadAnonymousEntry() {
    if (!firstName.trim() || !email.trim()) {
      setFormError(t('protototo.identityRequired'));
      return;
    }
    setFormError(null);
    setAnonymousLookupAttempted(true);
    anonymousEntryLookup.mutate({
      roundId: round.id,
      firstName: firstName.trim(),
      email: email.trim(),
    });
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      {!signedIn ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('protototo.yourDetails')}</CardTitle>
            <CardDescription>
              {t('protototo.anonymousDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="protototo-first-name">
                {t('protototo.firstName')}
              </Label>
              <Input
                id="protototo-first-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protototo-email">{t('protototo.email')}</Label>
              <Input
                id="protototo-email"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                disabled={anonymousEntryLookup.isPending}
                onClick={loadAnonymousEntry}
              >
                {anonymousEntryLookup.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="size-4" aria-hidden="true" />
                )}
                {t('protototo.loadEntry')}
              </Button>
              {anonymousEntryLookup.isError ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {anonymousEntryLookup.error.message}
                </p>
              ) : anonymousLookupAttempted &&
                !anonymousEntryLookup.isPending &&
                !anonymousEntryLookup.data ? (
                <p className="mt-2 text-sm text-muted-foreground" role="status">
                  {t('protototo.entryNotFound')}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : isLoadingEntry ? (
        <p
          className="flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t('protototo.loadingEntry')}
        </p>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="mb-1 text-xl font-semibold">
          {t('protototo.matches')}
        </legend>
        <p className="text-sm text-muted-foreground">
          {t('protototo.matchInstructions')}
        </p>
        {round.matches.map((match) => (
          <MatchPrediction
            key={match.id}
            match={match}
            picks={picks[match.id] ?? []}
            onChoose={(setIndex, winner) =>
              chooseWinner(match, setIndex, winner)
            }
          />
        ))}
      </fieldset>

      {!signedIn && round.tikkieUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('protototo.payment')}</CardTitle>
            <CardDescription>
              {t('protototo.paymentDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild type="button" variant="outline">
              <a
                href={round.tikkieUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setTikkieOpened(true)}
              >
                {t('protototo.openTikkie')}
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm">
              <input
                className="mt-0.5 size-4 accent-current"
                type="checkbox"
                checked={paymentClaimed}
                onChange={(event) => setPaymentClaimed(event.target.checked)}
              />
              <span>{t('protototo.paidConfirmation')}</span>
            </label>
          </CardContent>
        </Card>
      ) : null}

      {formError ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </div>
      ) : null}
      {saved ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {t('protototo.saved')}
        </div>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        disabled={submitEntry.isPending || isLoadingEntry}
      >
        {submitEntry.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {t('protototo.saveEntry')}
      </Button>
    </form>
  );
}

function MatchPrediction({
  match,
  picks,
  onChoose,
}: {
  match: ProtototoMatch;
  picks: Array<boolean | null>;
  onChoose: (setIndex: number, winner: boolean) => void;
}) {
  const { locale, t } = useI18n();
  const subject = participantTeamName(match);
  const opponent = opponentTeamName(match);
  const count = visibleSetCount(match, picks);

  return (
    <Card className="gap-4 py-5">
      <CardHeader className="gap-2 px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            {match.homeTeamName}{' '}
            <span className="text-muted-foreground">–</span>{' '}
            {match.awayTeamName}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(match.startsAt, locale)}
          </span>
        </div>
        <CardDescription>
          {t(`protototo.formats.${match.format}`)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {Array.from({ length: count }, (_, setIndex) => {
          const selected = picks[setIndex];
          return (
            <div
              key={setIndex}
              className="grid gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[5rem_1fr_1fr] sm:items-center"
              role="group"
              aria-label={`${t('protototo.set')} ${setIndex + 1}`}
            >
              <span className="text-sm font-medium">
                {t('protototo.set')} {setIndex + 1}
              </span>
              <WinnerButton
                selected={selected === true}
                onClick={() => onChoose(setIndex, true)}
                label={subject}
              />
              <WinnerButton
                selected={selected === false}
                onClick={() => onChoose(setIndex, false)}
                label={opponent}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function WinnerButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-background hover:bg-accent'
      }`}
    >
      {label}
    </button>
  );
}

function ClosedRound({
  signedIn,
  roundId,
  memberRounds,
}: {
  signedIn: boolean;
  roundId: string;
  memberRounds: ReturnType<typeof normalizeRounds>;
}) {
  const { t } = useI18n();
  const canOpenStanding = memberRounds.some(({ id }) => id === roundId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('protototo.bettingClosed')}</CardTitle>
        <CardDescription>
          {signedIn
            ? t('protototo.bettingClosedMember')
            : t('protototo.bettingClosedAnonymous')}
        </CardDescription>
      </CardHeader>
      {signedIn && canOpenStanding ? (
        <CardContent>
          <Button asChild>
            <Link href={`/protototo/standings?roundId=${roundId}`}>
              {t('protototo.viewStandings')}
            </Link>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

function RoundHistory({
  rounds,
}: {
  rounds: ReturnType<typeof normalizeRounds>;
}) {
  const { locale, t } = useI18n();
  const now = new Date();
  const closedRounds = rounds.filter(
    (round) =>
      round.status !== 'draft' &&
      round.status !== 'archived' &&
      new Date(round.closesAt) <= now,
  );
  if (closedRounds.length === 0) return null;
  return (
    <section className="space-y-3" aria-labelledby="round-history-title">
      <h2 id="round-history-title" className="text-xl font-semibold">
        {t('protototo.history')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {closedRounds.map((round) => (
          <Link
            key={round.id}
            href={`/protototo/standings?roundId=${round.id}`}
            className="rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="font-medium">{round.title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {formatDateTime(round.closesAt, locale)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PageState({
  icon: Icon,
  spin = false,
  text,
  detail,
  action,
}: {
  icon: typeof Trophy;
  spin?: boolean;
  text: string;
  detail?: string;
  action?: React.ReactNode;
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
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function emptyPicks(matches: ProtototoMatch[]): PickState {
  return Object.fromEntries(
    matches.map((match) => [
      match.id,
      Array.from({ length: visibleSetCount(match, []) }, () => null),
    ]),
  );
}

function picksFromEntry(
  matches: ProtototoMatch[],
  entry: ProtototoEntry,
): PickState {
  const predictions = new Map(
    entry.predictions.map(({ matchId, setWinners }) => [matchId, setWinners]),
  );
  return Object.fromEntries(
    matches.map((match) => {
      const values = predictions.get(match.id) ?? [];
      const count = Math.max(values.length, visibleSetCount(match, values));
      return [
        match.id,
        Array.from({ length: count }, (_, index) => values[index] ?? null),
      ];
    }),
  );
}

function predictionsFromPicks(
  matches: ProtototoMatch[],
  picks: PickState,
): ProtototoPrediction[] {
  return matches.map((match) => ({
    matchId: match.id,
    setWinners: (picks[match.id] ?? []).filter(
      (winner): winner is boolean => typeof winner === 'boolean',
    ),
  }));
}

function visibleSetCount(
  match: ProtototoMatch,
  picks: Array<boolean | null>,
): number {
  const selected = picks.filter(
    (winner): winner is boolean => typeof winner === 'boolean',
  );
  return predictionSetCount(match.format, selected);
}
