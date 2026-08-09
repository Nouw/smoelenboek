'use client';

import type { CommitteeRole, CommitteeRosterMembershipDto } from '@repo/api';
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
import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import {
  CenteredState,
  CommitteeFields,
  ErrorMessage,
} from '../committee-admin-content';

const roleTranslationKeys = {
  commissielid: 'profile.roles.committeeMember',
  commissaris_externe_zaken: 'profile.roles.externalAffairs',
  wedstrijdsecretaris: 'profile.roles.matchSecretary',
  penningmeester: 'profile.roles.treasurer',
  commissaris_zaalwacht_en_arbitrage: 'profile.roles.refereeingOfficer',
  voorzitter: 'profile.roles.chair',
  secretaris: 'profile.roles.secretary',
} satisfies Record<CommitteeRole, TranslationKey>;

const committeeRoles = Object.keys(roleTranslationKeys) as CommitteeRole[];

export function CommitteeAdminDetail({
  committeeId,
  initialSeasonKey,
}: {
  committeeId: string;
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
  const selectedSeasonKey = seasonKey ?? currentSeason.data?.key;
  const roster = trpc.committees.rosterForSeason.useQuery(
    { committeeId, seasonKey: selectedSeasonKey ?? 1900 },
    {
      enabled: currentUser.isAdmin && selectedSeasonKey !== undefined,
      retry: false,
    },
  );
  const utils = trpc.useUtils();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [removingMembership, setRemovingMembership] =
    useState<CommitteeRosterMembershipDto | null>(null);

  useEffect(() => {
    if (seasonKey === undefined && currentSeason.data) {
      setSeasonKey(currentSeason.data.key);
    }
  }, [currentSeason.data, seasonKey]);

  async function refresh() {
    await Promise.all([
      utils.committees.invalidate(),
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

  const updateCommittee = trpc.committees.update.useMutation(
    mutationOptions(t('committees.admin.updated')),
  );
  const archiveCommittee = trpc.committees.archive.useMutation(
    mutationOptions(t('committees.admin.archived')),
  );
  const restoreCommittee = trpc.committees.restore.useMutation(
    mutationOptions(t('committees.admin.restored')),
  );

  if (currentUser.isLoading) {
    return <CenteredState icon={Loader2} spin text={t('common.loading')} />;
  }
  if (!currentUser.isAdmin) {
    return (
      <CenteredState
        icon={ShieldAlert}
        text={t('committees.admin.forbidden')}
        detail={t('committees.admin.forbiddenDescription')}
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
          t('committees.admin.loadError')
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
        text={t('committees.notFound')}
        detail={t('committees.notFoundDescription')}
      />
    );
  }

  const { committee, season, memberships } = roster.data;

  function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const imageUrl = String(data.get('imageUrl') ?? '').trim();
    if (!name) return;
    updateCommittee.mutate({
      id: committee.id,
      name,
      imageUrl: imageUrl || null,
    });
  }

  function changeSeason(value: string) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 3000) return;
    setSeasonKey(parsed);
    router.replace(`/committees/admin/${committeeId}?season=${parsed}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href="/committees/admin">
            <ArrowLeft />
            {t('committees.admin.back')}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/committees/${committee.id}`}>
            <ExternalLink />
            {committee.name}
          </Link>
        </Button>
      </div>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {committee.name}
        </h1>
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
      {committee.archivedAt ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          <Archive className="size-4" />
          {t('committees.admin.archivedNotice')}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t('committees.admin.roster')}</CardTitle>
            <CardDescription>{season.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full max-w-xs space-y-2">
                <Label htmlFor="season-key">
                  {t('committees.admin.seasonStartYear')}
                </Label>
                <Input
                  id="season-key"
                  type="number"
                  min={1900}
                  max={3000}
                  list="known-committee-seasons"
                  value={selectedSeasonKey ?? ''}
                  onChange={(event) => changeSeason(event.target.value)}
                />
                <datalist id="known-committee-seasons">
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
                disabled={Boolean(committee.archivedAt)}
              >
                <Plus />
                {t('committees.admin.addMember')}
              </Button>
            </div>

            <RosterSection
              memberships={memberships}
              onRemove={setRemovingMembership}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>{t('committees.admin.editCommittee')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={submitUpdate}>
                <CommitteeFields
                  key={committee.updatedAt}
                  defaults={{
                    name: committee.name,
                    imageUrl: committee.imageUrl,
                  }}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateCommittee.isPending}
                >
                  {updateCommittee.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : null}
                  {updateCommittee.isPending
                    ? t('committees.admin.saving')
                    : t('committees.admin.save')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent>
              {committee.archivedAt ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={restoreCommittee.isPending}
                  onClick={() => restoreCommittee.mutate({ id: committee.id })}
                >
                  <RotateCcw />
                  {t('committees.admin.restore')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={archiveCommittee.isPending}
                  onClick={() => archiveCommittee.mutate({ id: committee.id })}
                >
                  <Archive />
                  {t('committees.admin.archive')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        committeeId={committee.id}
        season={season}
        onChanged={async () => {
          setNotice(t('committees.admin.memberAdded'));
          await refresh();
        }}
      />
      <RemoveMembershipDialog
        membership={removingMembership}
        onOpenChange={(open) => {
          if (!open) setRemovingMembership(null);
        }}
        onChanged={async () => {
          setRemovingMembership(null);
          setNotice(t('committees.admin.memberRemoved'));
          await refresh();
        }}
      />
    </div>
  );
}

function RosterSection({
  memberships,
  onRemove,
}: {
  memberships: CommitteeRosterMembershipDto[];
  onRemove: (membership: CommitteeRosterMembershipDto) => void;
}) {
  const { t } = useI18n();
  if (memberships.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t('committees.admin.noMembers')}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {memberships.map((membership) => (
        <div
          key={membership.id}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          <Avatar className="size-10">
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
            <p className="truncate text-sm text-muted-foreground">
              {t(roleTranslationKeys[membership.role])}
            </p>
            <p className="text-xs text-muted-foreground">
              {membership.startedOn}
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={t('committees.admin.removeMember')}
            onClick={() => onRemove(membership)}
          >
            <UserRoundMinus />
          </Button>
        </div>
      ))}
    </div>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  committeeId,
  season,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  committeeId: string;
  season: { key: number; startsOn: string; endsBefore: string };
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<CommitteeRole>('commissielid');
  const [startedOn, setStartedOn] = useState(() => defaultStartDate(season));
  const [error, setError] = useState<string | null>(null);
  const users = trpc.user.search.useQuery(
    { query: debouncedSearch },
    { enabled: open, retry: false },
  );
  const assignMember = trpc.committees.assignMember.useMutation({
    async onSuccess() {
      setError(null);
      setSearch('');
      setDebouncedSearch('');
      setSelectedUserId('');
      await onChanged();
      onOpenChange(false);
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
      setError(t('committees.admin.selectMember'));
      return;
    }
    assignMember.mutate({
      userId: selectedUserId,
      committeeId,
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
            <DialogTitle>{t('committees.admin.addMember')}</DialogTitle>
            <DialogDescription>
              {t('committees.admin.addMemberDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="committee-member-search">
              {t('committees.admin.searchMember')}
            </Label>
            <Input
              id="committee-member-search"
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
                  {t('committees.admin.noSearchResults')}
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
              <Label htmlFor="committee-member-role">
                {t('committees.admin.role')}
              </Label>
              <select
                id="committee-member-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as CommitteeRole)
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {committeeRoles.map((committeeRole) => (
                  <option key={committeeRole} value={committeeRole}>
                    {t(roleTranslationKeys[committeeRole])}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="committee-member-started-on">
                {t('committees.admin.startedOn')}
              </Label>
              <Input
                id="committee-member-started-on"
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
                ? t('committees.admin.adding')
                : t('committees.admin.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveMembershipDialog({
  membership,
  onOpenChange,
  onChanged,
}: {
  membership: CommitteeRosterMembershipDto | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const removeMember = trpc.committees.removeMember.useMutation({
    async onSuccess() {
      setError(null);
      await onChanged();
    },
    onError(mutationError) {
      setError(mutationError.message);
    },
  });

  useEffect(() => {
    if (membership) setError(null);
  }, [membership]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membership) return;
    removeMember.mutate({ membershipId: membership.id });
  }

  return (
    <Dialog open={Boolean(membership)} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('committees.admin.removeMember')}</DialogTitle>
            <DialogDescription>
              {t('committees.admin.removeMemberDescription')}
            </DialogDescription>
          </DialogHeader>
          {error ? <ErrorMessage message={error} /> : null}
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
                ? t('committees.admin.removing')
                : t('committees.admin.remove')}
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
