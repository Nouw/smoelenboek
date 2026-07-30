'use client';

import type { TeamCategory } from '@repo/api';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardTitle } from '@repo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  AlertCircle,
  Archive,
  ChevronRight,
  ImageIcon,
  Loader2,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { trpc } from '@/app/trpc';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import { sortTeamsByNameNumber } from '../team-filters';

export function TeamAdminContent() {
  const { t } = useI18n();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const teams = trpc.teams.list.useQuery(undefined, {
    enabled: currentUser.isAdmin,
    retry: false,
  });
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createTeam = trpc.teams.create.useMutation({
    async onSuccess(team) {
      setError(null);
      setCreateOpen(false);
      await utils.teams.list.invalidate();
      router.push(`/teams/admin/${team.id}`);
    },
    onError(mutationError) {
      setError(mutationError.message);
    },
  });

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

  const allTeams = sortTeamsByNameNumber(teams.data ?? []);
  const activeTeams = allTeams.filter(({ archivedAt }) => archivedAt === null);
  const archivedTeams = allTeams.filter(
    ({ archivedAt }) => archivedAt !== null,
  );

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const category = data.get('category');
    const imageUrl = String(data.get('imageUrl') ?? '').trim();

    if (!name || (category !== 'men' && category !== 'women')) {
      return;
    }

    createTeam.mutate({
      name,
      category,
      imageUrl: imageUrl || null,
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('teams.admin.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('teams.admin.description')}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              {t('teams.admin.newTeam')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form className="space-y-5" onSubmit={submitCreate}>
              <DialogHeader>
                <DialogTitle>{t('teams.admin.createTeam')}</DialogTitle>
                <DialogDescription>
                  {t('teams.admin.createDescription')}
                </DialogDescription>
              </DialogHeader>
              <TeamFields />
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createTeam.isPending}>
                  {createTeam.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Plus />
                  )}
                  {createTeam.isPending
                    ? t('teams.admin.creating')
                    : t('teams.admin.createTeam')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {teams.isError ? (
        <ErrorMessage message={teams.error.message} />
      ) : teams.isLoading ? (
        <CenteredState icon={Loader2} spin text={t('teams.loading')} />
      ) : (
        <>
          <TeamSection
            title={t('teams.admin.activeTeams')}
            empty={t('teams.admin.noActiveTeams')}
            teams={activeTeams}
          />
          <TeamSection
            title={t('teams.admin.archivedTeams')}
            empty={t('teams.admin.noArchivedTeams')}
            teams={archivedTeams}
            archived
          />
        </>
      )}
    </div>
  );
}

function TeamFields({
  defaults,
}: {
  defaults?: { name: string; category: TeamCategory; imageUrl: string | null };
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team-name">{t('teams.admin.name')}</Label>
        <Input
          id="team-name"
          name="name"
          defaultValue={defaults?.name}
          maxLength={100}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-category">{t('teams.admin.category')}</Label>
        <select
          id="team-category"
          name="category"
          defaultValue={defaults?.category ?? 'men'}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="men">{t('teams.admin.men')}</option>
          <option value="women">{t('teams.admin.women')}</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-image-url">
          {t('teams.admin.imageUrl')} ({t('teams.admin.optional')})
        </Label>
        <Input
          id="team-image-url"
          name="imageUrl"
          type="url"
          defaultValue={defaults?.imageUrl ?? ''}
        />
      </div>
    </div>
  );
}

export { TeamFields };

type TeamItem = {
  id: string;
  name: string;
  category: TeamCategory;
  imageUrl: string | null;
  archivedAt: string | null;
};

function TeamSection({
  title,
  empty,
  teams,
  archived = false,
}: {
  title: string;
  empty: string;
  teams: TeamItem[];
  archived?: boolean;
}) {
  const { t } = useI18n();

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {teams.length}
        </span>
      </div>
      {teams.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/admin/${team.id}`}>
              <Card className="h-full py-4 shadow-none transition-colors hover:border-foreground/30">
                <CardContent className="flex items-center gap-4 px-4">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                    {team.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={team.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : archived ? (
                      <Archive className="size-5" />
                    ) : (
                      <ImageIcon className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.category === 'men'
                        ? t('teams.admin.men')
                        : t('teams.admin.women')}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CenteredState({
  icon: Icon,
  text,
  detail,
  spin = false,
}: {
  icon: typeof Loader2;
  text: string;
  detail?: string;
  spin?: boolean;
}) {
  return (
    <Card className="mx-auto w-full max-w-xl shadow-none">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <Icon className={`size-9 ${spin ? 'animate-spin' : ''}`} />
        <CardTitle>{text}</CardTitle>
        {detail ? (
          <p className="text-sm text-muted-foreground">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="size-4 shrink-0" />
      {message}
    </div>
  );
}

export { CenteredState, ErrorMessage };
