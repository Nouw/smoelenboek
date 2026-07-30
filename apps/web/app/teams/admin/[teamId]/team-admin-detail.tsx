'use client';

import type {
  TeamCategory,
  TeamRole,
  TeamRosterMembershipDto,
} from '@repo/api';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  ShieldAlert,
  UserRound,
  UserRoundMinus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { trpc } from '@/app/trpc';
import { TeamFields, CenteredState, ErrorMessage } from '../team-admin-content';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n, type TranslationKey } from '@/lib/i18n';

const roleTranslationKeys = {
  libero: 'profile.roles.libero',
  middle: 'profile.roles.middle',
  coach_trainer: 'profile.roles.coachTrainer',
  setter: 'profile.roles.setter',
  outside_hitter: 'profile.roles.outsideHitter',
  opposite_hitter: 'profile.roles.oppositeHitter',
} satisfies Record<TeamRole, TranslationKey>;

const teamRoles = Object.keys(roleTranslationKeys) as TeamRole[];

export function TeamAdminDetail({
  teamId,
  initialSeasonKey,
}: {
  teamId: string;
  initialSeasonKey?: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const currentSeason = trpc.seasons.current.useQuery(undefined, {
    enabled: currentUser.isAdmin,
    retry: false,
  });
  const seasons = trpc.seasons.list.useQuery(undefined, {
    enabled: currentUser.isAdmin,
    retry: false,
  });
  const [seasonKey, setSeasonKey] = useState<number | undefined>(
    initialSeasonKey,
  );
  const selectedSeasonKey = seasonKey ?? currentSeason.data?.key ?? 1900;
  const roster = trpc.teams.rosterForSeason.useQuery(
    { teamId, seasonKey: selectedSeasonKey },
    {
      enabled: currentUser.isAdmin && selectedSeasonKey !== 1900,
      retry: false,
    },
  );
  const utils = trpc.useUtils();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [endingMembership, setEndingMembership] =
    useState<TeamRosterMembershipDto | null>(null);

  useEffect(() => {
    if (seasonKey === undefined && currentSeason.data) {
      setSeasonKey(currentSeason.data.key);
    }
  }, [currentSeason.data, seasonKey]);

  async function refresh() {
    await Promise.all([
      utils.teams.invalidate(),
      utils.seasons.list.invalidate(),
      utils.user.membershipHistory.invalidate(),
    ]);
  }

  function mutationOptions(successMessage: string) {
    return {
      async onSuccess() {
        setNotice(successMessage);
        setActionError(null);
        await refresh();
      },
      onError(error: { message: string }) {
        setNotice(null);
        setActionError(error.message);
      },
    };
  }

  const updateTeam = trpc.teams.update.useMutation(
    mutationOptions(t('teams.admin.updated')),
  );
  const archiveTeam = trpc.teams.archive.useMutation(
    mutationOptions(t('teams.admin.archived')),
  );
  const restoreTeam = trpc.teams.restore.useMutation(
    mutationOptions(t('teams.admin.restored')),
  );

  if (currentUser.isLoading) {
    return <CenteredState icon={Loader2} spin text={t('common.loading')} />;
  }
  if (!currentUser.isAdmin) {
    return (
      <CenteredState
        icon={ShieldAlert}
        text={t('teams.admin.forbidden')}
        detail={t('teams.admin.forbiddenDescription')}
      />
    );
  }
  if (currentSeason.isError || seasons.isError || roster.isError) {
    return (
      <ErrorMessage
        message={
          currentSeason.error?.message ??
          seasons.error?.message ??
          roster.error?.message ??
          t('teams.admin.loadError')
        }
      />
    );
  }
  if (currentSeason.isLoading || seasons.isLoading || roster.isLoading) {
    return <CenteredState icon={Loader2} spin text={t('common.loading')} />;
  }
  if (!roster.data) {
    return (
      <CenteredState
        icon={AlertCircle}
        text={t('teams.notFound')}
        detail={t('teams.notFoundDescription')}
      />
    );
  }

  const { team, season, memberships } = roster.data;
  const activeMemberships = memberships.filter(
    ({ endedOn }) => endedOn === null,
  );
  const coaches = activeMemberships.filter(
    ({ role }) => role === 'coach_trainer',
  );
  const players = activeMemberships.filter(
    ({ role }) => role !== 'coach_trainer',
  );
  const endedMemberships = memberships.filter(
    ({ endedOn }) => endedOn !== null,
  );

  function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const category = data.get('category');
    const imageUrl = String(data.get('imageUrl') ?? '').trim();

    if (!name || (category !== 'men' && category !== 'women')) {
      return;
    }

    updateTeam.mutate({
      id: team.id,
      name,
      category,
      imageUrl: imageUrl || null,
    });
  }

  function changeSeason(value: string) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 3000) {
      return;
    }
    setSeasonKey(parsed);
    router.replace(`/teams/admin/${teamId}?season=${parsed}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href="/teams/admin">
            <ArrowLeft />
            {t('teams.admin.back')}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/teams/${team.id}`}>
            <ExternalLink />
            {team.name}
          </Link>
        </Button>
      </div>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{team.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {team.category === 'men'
            ? t('teams.admin.men')
            : t('teams.admin.women')}
        </p>
      </header>

      {actionError ? <ErrorMessage message={actionError} /> : null}
      {notice ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {notice}
        </div>
      ) : null}
      {team.archivedAt ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          <Archive className="size-4" />
          {t('teams.admin.archivedNotice')}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t('teams.admin.roster')}</CardTitle>
            <CardDescription>{season.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full max-w-xs space-y-2">
                <Label htmlFor="season-key">
                  {t('teams.admin.seasonStartYear')}
                </Label>
                <Input
                  id="season-key"
                  type="number"
                  min={1900}
                  max={3000}
                  list="known-seasons"
                  value={selectedSeasonKey}
                  onChange={(event) => changeSeason(event.target.value)}
                />
                <datalist id="known-seasons">
                  {seasons.data?.map((knownSeason) => (
                    <option key={knownSeason.key} value={knownSeason.key}>
                      {knownSeason.label}
                    </option>
                  ))}
                </datalist>
              </div>
              <Button
                type="button"
                onClick={() => setAddOpen(true)}
                disabled={Boolean(team.archivedAt)}
              >
                <Plus />
                {t('teams.admin.addMember')}
              </Button>
            </div>

            <RosterSection
              title={t('teams.coaches')}
              empty={t('teams.admin.noCoaches')}
              memberships={coaches}
              onEnd={setEndingMembership}
            />
            <RosterSection
              title={t('teams.players')}
              empty={t('teams.admin.noPlayers')}
              memberships={players}
              onEnd={setEndingMembership}
            />
            <RosterSection
              title={t('teams.admin.endedMemberships')}
              empty={t('teams.admin.noEndedMemberships')}
              memberships={endedMemberships}
              ended
            />
          </CardContent>
        </Card>

        <Card className="h-fit shadow-none">
          <CardHeader>
            <CardTitle>{t('teams.admin.editTeam')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submitUpdate}>
              <TeamFields
                key={team.updatedAt}
                defaults={{
                  name: team.name,
                  category: team.category as TeamCategory,
                  imageUrl: team.imageUrl,
                }}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateTeam.isPending}
              >
                {updateTeam.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                {updateTeam.isPending
                  ? t('teams.admin.saving')
                  : t('teams.admin.save')}
              </Button>
              {team.archivedAt ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={restoreTeam.isPending}
                  onClick={() => restoreTeam.mutate({ id: team.id })}
                >
                  <RotateCcw />
                  {t('teams.admin.restore')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={archiveTeam.isPending}
                  onClick={() => archiveTeam.mutate({ id: team.id })}
                >
                  <Archive />
                  {t('teams.admin.archive')}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        teamId={team.id}
        season={season}
        onChanged={async () => {
          setNotice(t('teams.admin.memberAdded'));
          setActionError(null);
          await refresh();
        }}
      />
      <EndMembershipDialog
        membership={endingMembership}
        season={season}
        onOpenChange={(open) => {
          if (!open) setEndingMembership(null);
        }}
        onChanged={async () => {
          setEndingMembership(null);
          setNotice(t('teams.admin.membershipEnded'));
          setActionError(null);
          await refresh();
        }}
      />
    </div>
  );
}

function RosterSection({
  title,
  empty,
  memberships,
  ended = false,
  onEnd,
}: {
  title: string;
  empty: string;
  memberships: TeamRosterMembershipDto[];
  ended?: boolean;
  onEnd?: (membership: TeamRosterMembershipDto) => void;
}) {
  const { t } = useI18n();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {memberships.length}
        </span>
      </div>
      {memberships.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {memberships.map((membership) => (
            <div
              key={membership.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Avatar className="size-11">
                <AvatarImage
                  src={membership.user.imageUrl ?? undefined}
                  alt={membership.user.name}
                />
                <AvatarFallback>
                  <UserRound className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${membership.user.id}`}
                  className="truncate font-medium hover:underline"
                >
                  {membership.user.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {t(roleTranslationKeys[membership.role])}
                  {' · '}
                  {membership.startedOn}
                  {membership.endedOn ? ` – ${membership.endedOn}` : ''}
                </p>
              </div>
              {!ended && onEnd ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t('teams.admin.endMembership')}
                  onClick={() => onEnd(membership)}
                >
                  <UserRoundMinus />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  teamId,
  season,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  season: { key: number; startsOn: string; endsBefore: string };
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<TeamRole>('setter');
  const [startedOn, setStartedOn] = useState(() => defaultStartDate(season));
  const [error, setError] = useState<string | null>(null);
  const users = trpc.user.search.useQuery(
    { query: debouncedSearch },
    { enabled: open, retry: false },
  );
  const assignMember = trpc.teams.assignMember.useMutation({
    async onSuccess() {
      setError(null);
      setSearch('');
      setDebouncedSearch('');
      setSelectedUserId('');
      await onChanged();
    },
    onError(mutationError) {
      setError(mutationError.message);
    },
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (open) {
      setStartedOn(defaultStartDate(season));
      setError(null);
    }
  }, [open, season]);

  const lastSeasonDate = useMemo(
    () => dayBefore(season.endsBefore),
    [season.endsBefore],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUserId) {
      setError(t('teams.admin.selectMember'));
      return;
    }
    assignMember.mutate({
      userId: selectedUserId,
      teamId,
      seasonKey: season.key,
      role,
      startedOn,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('teams.admin.addMember')}</DialogTitle>
            <DialogDescription>
              {t('teams.admin.addMemberDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="member-search">
              {t('teams.admin.searchMember')}
            </Label>
            <Input
              id="member-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoComplete="off"
            />
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-1">
              {users.isLoading ? (
                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : (users.data?.length ?? 0) === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {t('teams.admin.noSearchResults')}
                </p>
              ) : (
                users.data?.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${selectedUserId === user.id ? 'bg-muted' : ''}`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <Avatar className="size-8">
                      <AvatarImage
                        src={user.imageUrl ?? undefined}
                        alt={user.name}
                      />
                      <AvatarFallback>
                        <UserRound className="size-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {user.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-role">{t('teams.admin.role')}</Label>
              <select
                id="member-role"
                value={role}
                onChange={(event) => setRole(event.target.value as TeamRole)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {teamRoles.map((teamRole) => (
                  <option key={teamRole} value={teamRole}>
                    {t(roleTranslationKeys[teamRole])}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-started-on">
                {t('teams.admin.startedOn')}
              </Label>
              <Input
                id="member-started-on"
                type="date"
                min={season.startsOn}
                max={lastSeasonDate}
                value={startedOn}
                onChange={(event) => setStartedOn(event.target.value)}
                required
              />
            </div>
          </div>
          {users.isError || error ? (
            <p className="text-sm text-destructive" role="alert">
              {error ?? users.error?.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={assignMember.isPending}>
              {assignMember.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Plus />
              )}
              {assignMember.isPending
                ? t('teams.admin.adding')
                : t('teams.admin.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EndMembershipDialog({
  membership,
  season,
  onOpenChange,
  onChanged,
}: {
  membership: TeamRosterMembershipDto | null;
  season: { startsOn: string; endsBefore: string };
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [endedOn, setEndedOn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const removeMember = trpc.teams.removeMember.useMutation({
    async onSuccess() {
      setError(null);
      await onChanged();
    },
    onError(mutationError) {
      setError(mutationError.message);
    },
  });

  useEffect(() => {
    if (membership) {
      setEndedOn(defaultEndDate(membership.startedOn, season));
      setError(null);
    }
  }, [membership, season]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membership) return;
    removeMember.mutate({ membershipId: membership.id, endedOn });
  }

  return (
    <Dialog open={Boolean(membership)} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('teams.admin.endMembership')}</DialogTitle>
            <DialogDescription>
              {t('teams.admin.endMembershipDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="membership-ended-on">
              {t('teams.admin.endedOn')}
            </Label>
            <Input
              id="membership-ended-on"
              type="date"
              min={membership?.startedOn ?? season.startsOn}
              max={dayBefore(season.endsBefore)}
              value={endedOn}
              onChange={(event) => setEndedOn(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={removeMember.isPending}>
              {removeMember.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UserRoundMinus />
              )}
              {removeMember.isPending
                ? t('teams.admin.ending')
                : t('teams.admin.end')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function defaultStartDate(season: { startsOn: string; endsBefore: string }) {
  const today = todayInAmsterdam();
  return today >= season.startsOn && today < season.endsBefore
    ? today
    : season.startsOn;
}

function defaultEndDate(
  startedOn: string,
  season: { startsOn: string; endsBefore: string },
) {
  const today = todayInAmsterdam();
  const lastSeasonDate = dayBefore(season.endsBefore);
  if (today < startedOn) return startedOn;
  if (today > lastSeasonDate) return lastSeasonDate;
  return today;
}

function todayInAmsterdam() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dayBefore(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().slice(0, 10);
}
