'use client';

import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ArrowLeft, Loader2, Plus, Vote } from 'lucide-react';
import Link from 'next/link';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import { trpc } from '../../trpc';
import { formatPollDateTime } from '../polls-model';
import { PollForm, type PollFormValue } from './poll-form';

export function PollsAdminContent() {
  const { t, locale } = useI18n();
  const currentUser = useCurrentUser();
  const utils = trpc.useUtils();
  const polls = trpc.polls.admin.list.useQuery(undefined, {
    enabled: currentUser.isAdmin,
  });
  const create = trpc.polls.admin.create.useMutation({
    async onSuccess() {
      await utils.polls.admin.list.invalidate();
    },
  });

  if (!currentUser.isAdmin)
    return <AdminState text={t('polls.admin.forbidden')} />;
  if (polls.isLoading)
    return <AdminState loading text={t('polls.admin.loading')} />;
  if (polls.isError) return <AdminState text={polls.error.message} />;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('polls.admin.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('polls.admin.description')}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/polls">
            <ArrowLeft />
            {t('polls.admin.memberPage')}
          </Link>
        </Button>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t('polls.admin.polls')}</CardTitle>
            <CardDescription>
              {t('polls.admin.pollsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {polls.data?.length ? (
              polls.data.map((poll) => (
                <Link
                  key={poll.id}
                  href={`/polls/admin/${poll.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium leading-snug">{poll.question}</p>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs">
                      {t(`polls.status.${poll.status}`)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatPollDateTime(poll.opensAt, locale)} –{' '}
                    {formatPollDateTime(poll.closesAt, locale)}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('polls.admin.noPolls')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="h-fit shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              {t('polls.admin.newPoll')}
            </CardTitle>
            <CardDescription>
              {t('polls.admin.draftDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PollForm
              pending={create.isPending}
              submitLabel={t('polls.admin.createDraft')}
              onSubmit={(value: PollFormValue) => create.mutate(value)}
            />
            {create.error ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {create.error.message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminState({ text, loading }: { text: string; loading?: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
      {loading ? (
        <Loader2 className="mb-3 size-6 animate-spin" />
      ) : (
        <Vote className="mb-3 size-6" />
      )}
      <p className="font-medium">{text}</p>
    </div>
  );
}
