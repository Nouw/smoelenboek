'use client';

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

export function CommitteeAdminContent() {
  const { t } = useI18n();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const committees = trpc.committees.list.useQuery(undefined, {
    enabled: currentUser.isAdmin,
    retry: false,
  });
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createCommittee = trpc.committees.create.useMutation({
    async onSuccess(committee) {
      setError(null);
      setCreateOpen(false);
      await utils.committees.list.invalidate();
      router.push(`/committees/admin/${committee.id}`);
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
        text={t('committees.admin.forbidden')}
        detail={t('committees.admin.forbiddenDescription')}
      />
    );
  }

  const allCommittees = [...(committees.data ?? [])].sort((left, right) =>
    left.name.localeCompare(right.name, 'nl', { sensitivity: 'base' }),
  );
  const active = allCommittees.filter(({ archivedAt }) => archivedAt === null);
  const archived = allCommittees.filter(
    ({ archivedAt }) => archivedAt !== null,
  );

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const imageUrl = String(data.get('imageUrl') ?? '').trim();
    if (!name) return;
    createCommittee.mutate({ name, imageUrl: imageUrl || null });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('committees.admin.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('committees.admin.description')}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              {t('committees.admin.newCommittee')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form className="space-y-5" onSubmit={submitCreate}>
              <DialogHeader>
                <DialogTitle>
                  {t('committees.admin.createCommittee')}
                </DialogTitle>
                <DialogDescription>
                  {t('committees.admin.createDescription')}
                </DialogDescription>
              </DialogHeader>
              <CommitteeFields />
              {error ? <ErrorMessage message={error} /> : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createCommittee.isPending}>
                  {createCommittee.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Plus />
                  )}
                  {createCommittee.isPending
                    ? t('committees.admin.creating')
                    : t('committees.admin.createCommittee')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {committees.isError ? (
        <ErrorMessage message={committees.error.message} />
      ) : committees.isLoading ? (
        <CenteredState icon={Loader2} spin text={t('committees.loading')} />
      ) : (
        <>
          <CommitteeSection
            title={t('committees.admin.activeCommittees')}
            empty={t('committees.admin.noActiveCommittees')}
            committees={active}
          />
          <CommitteeSection
            title={t('committees.admin.archivedCommittees')}
            empty={t('committees.admin.noArchivedCommittees')}
            committees={archived}
            archived
          />
        </>
      )}
    </div>
  );
}

export function CommitteeFields({
  defaults,
}: {
  defaults?: { name: string; imageUrl: string | null };
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="committee-name">{t('committees.admin.name')}</Label>
        <Input
          id="committee-name"
          name="name"
          defaultValue={defaults?.name}
          maxLength={100}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="committee-image-url">
          {t('committees.admin.imageUrl')} ({t('committees.admin.optional')})
        </Label>
        <Input
          id="committee-image-url"
          name="imageUrl"
          type="url"
          defaultValue={defaults?.imageUrl ?? ''}
        />
      </div>
    </div>
  );
}

function CommitteeSection({
  title,
  empty,
  committees,
  archived = false,
}: {
  title: string;
  empty: string;
  committees: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
  }>;
  archived?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {committees.length}
        </span>
      </div>
      {committees.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {committees.map((committee) => (
            <Link key={committee.id} href={`/committees/admin/${committee.id}`}>
              <Card className="h-full py-4 shadow-none transition-colors hover:border-foreground/30">
                <CardContent className="flex items-center gap-4 px-4">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                    {committee.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={committee.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : archived ? (
                      <Archive className="size-5" />
                    ) : (
                      <ImageIcon className="size-5" />
                    )}
                  </div>
                  <p className="min-w-0 flex-1 truncate font-semibold">
                    {committee.name}
                  </p>
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

export function CenteredState({
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

export function ErrorMessage({ message }: { message: string }) {
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
