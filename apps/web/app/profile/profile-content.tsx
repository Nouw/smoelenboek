'use client';

import { ProfileEditDialog } from '@/components/profile-edit-dialog';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n, type TranslationKey } from '@/lib/i18n';
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
import { Separator } from '@repo/ui/components/separator';
import { Skeleton } from '@repo/ui/components/skeleton';
import {
  AlertCircle,
  Cake,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  ExternalLink,
  Landmark,
  Mail,
  MapPin,
  Medal,
  Phone,
  RefreshCw,
  Settings,
  ShieldCheck,
  Shirt,
  Trophy,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { trpc } from '../trpc';

const roleTranslationKeys = {
  libero: 'profile.roles.libero',
  middle: 'profile.roles.middle',
  coach_trainer: 'profile.roles.coachTrainer',
  setter: 'profile.roles.setter',
  outside_hitter: 'profile.roles.outsideHitter',
  opposite_hitter: 'profile.roles.oppositeHitter',
  commissielid: 'profile.roles.committeeMember',
  commissaris_externe_zaken: 'profile.roles.externalAffairs',
  wedstrijdsecretaris: 'profile.roles.matchSecretary',
  penningmeester: 'profile.roles.treasurer',
  commissaris_zaalwacht_en_arbitrage: 'profile.roles.refereeingOfficer',
  voorzitter: 'profile.roles.chair',
  secretaris: 'profile.roles.secretary',
} satisfies Record<string, TranslationKey>;

export function ProfileContent({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [editOpen, setEditOpen] = useState(false);
  const currentUser = useCurrentUser();
  const profile = trpc.user.byId.useQuery({ userId }, { retry: false });
  const information = trpc.user.information.useQuery(
    { userId },
    {
      retry: false,
    },
  );
  const membershipHistory = trpc.user.membershipHistory.useQuery(
    { userId },
    { retry: false },
  );
  const teams = trpc.teams.list.useQuery(undefined, { retry: false });
  const committees = trpc.committees.list.useQuery(undefined, { retry: false });
  const syncUser = trpc.user.syncFromAuth.useMutation({
    onSuccess: async () => {
      await Promise.all([
        currentUser.refetch(),
        profile.refetch(),
        information.refetch(),
        membershipHistory.refetch(),
      ]);
    },
  });
  const firstError = [
    currentUser.error,
    profile.error,
    information.error,
    membershipHistory.error,
    teams.error,
    committees.error,
  ].find(Boolean);

  if (
    currentUser.isLoading ||
    profile.isLoading ||
    information.isLoading ||
    membershipHistory.isLoading ||
    teams.isLoading ||
    committees.isLoading
  ) {
    return <ProfileSkeleton />;
  }

  if (firstError) {
    return (
      <ProfileError
        message={firstError.message}
        onRetry={() => {
          void Promise.all([
            profile.refetch(),
            currentUser.refetch(),
            information.refetch(),
            membershipHistory.refetch(),
            teams.refetch(),
            committees.refetch(),
          ]);
        }}
      />
    );
  }

  const isOwner = currentUser.isOwner(userId);
  const canEditInformation = isOwner || currentUser.isAdmin;

  if (!profile.data) {
    return (
      <Card className="mx-auto w-full max-w-xl shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CircleUserRound className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">
              {isOwner
                ? t('profile.profileUnavailable')
                : t('profile.profileNotFound')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isOwner
                ? t('profile.profileUnavailableDescription')
                : t('profile.profileNotFoundDescription')}
            </p>
          </div>
          {isOwner ? (
            <>
              <Button
                type="button"
                onClick={() => syncUser.mutate()}
                disabled={syncUser.isPending}
              >
                <RefreshCw
                  className={syncUser.isPending ? 'animate-spin' : undefined}
                />
                {syncUser.isPending
                  ? t('profile.syncingProfile')
                  : t('profile.syncProfile')}
              </Button>
              {syncUser.error ? (
                <p className="text-sm text-destructive" role="alert">
                  {syncUser.error.message}
                </p>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const user = profile.data;
  const details = information.data;
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((part) => part?.slice(0, 1).toUpperCase())
      .join('') || displayName.slice(0, 2).toUpperCase();
  const address = [
    [details?.streetName, details?.houseNumber].filter(Boolean).join(' '),
    [details?.postcode, details?.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
  const mapHref = address
    ? 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(address)
    : undefined;
  const teamNames = new Map(teams.data?.map((team) => [team.id, team.name]));
  const committeeNames = new Map(
    committees.data?.map((committee) => [committee.id, committee.name]),
  );
  const seasons = [...(membershipHistory.data?.seasons ?? [])].sort(
    (left, right) => right.seasonKey - left.seasonKey,
  );
  const canSeeBankAccount =
    details !== null &&
    details !== undefined &&
    Object.prototype.hasOwnProperty.call(details, 'bankAccountNumber');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">
          {t('profile.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('profile.description')}
        </p>
      </div>

      <Card className="relative overflow-hidden shadow-none">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:p-8">
          <Avatar className="size-28 rounded-2xl border-4 border-background shadow-sm sm:size-36">
            <AvatarImage
              src={user.imageUrl ?? undefined}
              alt={t('profile.pictureAlt')}
              className="object-cover"
            />
            <AvatarFallback className="rounded-2xl text-3xl font-semibold">
              {initials || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-semibold sm:text-3xl">
                {displayName}
              </h2>
              <span className="inline-flex items-center rounded-full border bg-background/80 px-2.5 py-1 text-xs font-medium">
                <CheckCircle2 className="mr-1 size-3.5" />
                {user.role === 'admin'
                  ? t('profile.admin')
                  : t('profile.member')}
              </span>
            </div>
            {mapHref ? (
              <a
                href={mapHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t('profile.openAddress')}
              >
                <MapPin className="size-4 shrink-0" />
                <span className="truncate">{address}</span>
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {t('profile.noAddress')}
              </p>
            )}
          </div>
          {canEditInformation ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(true)}
            >
              <Settings />
              {t('profile.editProfile')}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <div className="space-y-6">
          <ProfileDetailsCard
            title={t('profile.contact')}
            description={t('profile.contactDescription')}
          >
            <DetailItem
              icon={Mail}
              label={t('profile.email')}
              value={user.email}
              emptyLabel={t('profile.notProvided')}
              href={user.email ? 'mailto:' + user.email : undefined}
            />
            <Separator />
            <DetailItem
              icon={Phone}
              label={t('profile.phoneNumber')}
              value={details?.phoneNumber}
              emptyLabel={t('profile.notProvided')}
              href={
                details?.phoneNumber
                  ? 'tel:' + details.phoneNumber.replace(/\s/g, '')
                  : undefined
              }
            />
            <Separator />
            <DetailItem
              icon={MapPin}
              label={t('profile.address')}
              value={address}
              emptyLabel={t('profile.notProvided')}
              href={mapHref}
              external
            />
          </ProfileDetailsCard>

          <ProfileDetailsCard
            title={t('profile.details')}
            description={t('profile.detailsDescription')}
          >
            <DetailItem
              icon={Cake}
              label={t('profile.birthDate')}
              value={formatDate(details?.birthDate)}
              emptyLabel={t('profile.notProvided')}
            />
            <Separator />
            <DetailItem
              icon={CalendarDays}
              label={t('profile.registrationDate')}
              value={formatDate(user.createdAt)}
              emptyLabel={t('profile.notProvided')}
            />
            <Separator />
            <DetailItem
              icon={Trophy}
              label={t('profile.bondNumber')}
              value={details?.bondNumber}
              emptyLabel={t('profile.notProvided')}
            />
            <Separator />
            <DetailItem
              icon={Shirt}
              label={t('profile.backNumber')}
              value={
                details?.backNumber === null ||
                details?.backNumber === undefined
                  ? undefined
                  : String(details.backNumber)
              }
              emptyLabel={t('profile.notProvided')}
            />
            {canSeeBankAccount ? (
              <>
                <Separator />
                <DetailItem
                  icon={Landmark}
                  label={t('profile.bankAccountNumber')}
                  value={details.bankAccountNumber}
                  emptyLabel={t('profile.notProvided')}
                />
              </>
            ) : null}
            <Separator />
            <DetailItem
              icon={Medal}
              label={t('profile.refereeLicense')}
              value={details?.refereeLicense}
              emptyLabel={t('profile.none')}
            />
          </ProfileDetailsCard>
        </div>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>{t('profile.activities')}</CardTitle>
              <CardDescription>
                {t('profile.activitiesDescription')}
              </CardDescription>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {membershipHistory.data?.seasonCount ?? 0}
            </span>
          </CardHeader>
          <CardContent>
            {seasons.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
                <UsersRound className="size-7 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t('profile.noActivities')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('profile.noActivitiesDescription')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {seasons.map((season) => {
                  const activities = [
                    ...season.teamMemberships.map((membership) => ({
                      id: membership.id,
                      icon: Shirt,
                      kind: t('profile.team'),
                      name:
                        teamNames.get(membership.teamId) ?? t('profile.team'),
                      role: t(roleTranslationKeys[membership.role]),
                    })),
                    ...season.committeeMemberships.map((membership) => ({
                      id: membership.id,
                      icon: ShieldCheck,
                      kind: t('profile.committee'),
                      name:
                        committeeNames.get(membership.committeeId) ??
                        t('profile.committee'),
                      role: t(roleTranslationKeys[membership.role]),
                    })),
                  ];

                  return (
                    <section
                      key={season.seasonKey}
                      className="rounded-lg border"
                      aria-label={t('profile.season') + ' ' + season.label}
                    >
                      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="size-4 text-muted-foreground" />
                          <h3 className="font-semibold">{season.label}</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {activities.length} {t('profile.activitiesCount')}
                        </span>
                      </div>
                      <div className="divide-y">
                        {activities.map((activity) => (
                          <ActivityRow key={activity.id} {...activity} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canEditInformation ? (
        <ProfileEditDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) {
              void Promise.all([profile.refetch(), information.refetch()]);
            }
          }}
          userId={userId}
          onSaved={async () => {
            await Promise.all([profile.refetch(), information.refetch()]);
          }}
        />
      ) : null}
    </div>
  );
}

function ProfileDetailsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">{children}</CardContent>
    </Card>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  emptyLabel,
  href,
  external = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null | undefined;
  emptyLabel: string;
  href?: string;
  external?: boolean;
}) {
  const content = value || emptyLabel;

  return (
    <div className="flex min-h-16 items-center gap-3 py-2">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {href && value ? (
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className="inline-flex max-w-full items-center gap-1 text-sm font-medium hover:underline"
          >
            <span className="truncate">{content}</span>
            {external ? <ExternalLink className="size-3.5 shrink-0" /> : null}
          </a>
        ) : (
          <p
            className={
              value ? 'text-sm font-medium' : 'text-sm text-muted-foreground'
            }
          >
            {content}
          </p>
        )}
      </div>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  kind,
  name,
  role,
}: {
  icon: LucideIcon;
  kind: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{kind}</p>
      </div>
      <span className="max-w-44 rounded-full border px-2.5 py-1 text-right text-xs font-medium">
        {role}
      </span>
    </div>
  );
}

function ProfileError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useI18n();

  return (
    <Card className="mx-auto w-full max-w-xl border-destructive/30 shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t('profile.loadError')}</h1>
          <p className="text-sm text-muted-foreground" role="alert">
            {message}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCw />
          {t('profile.retry')}
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Card className="shadow-none">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:p-8">
          <Skeleton className="size-28 rounded-2xl sm:size-36" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((key) => (
          <Card key={key} className="shadow-none">
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? [day, month, year].join('-') : value;
}
