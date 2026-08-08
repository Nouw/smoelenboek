'use client';

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
import { ArrowLeft, Archive, Loader2, Send, Trash2, Vote } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import { trpc } from '../../../trpc';
import { formatPollDateTime } from '../../polls-model';
import { PollForm, type PollFormValue } from '../poll-form';

export function PollAdminDetail({ pollId }: { pollId: string }) {
  const { t, locale } = useI18n();
  const currentUser = useCurrentUser();
  const router = useRouter();
  const utils = trpc.useUtils();
  const poll = trpc.polls.admin.get.useQuery(
    { pollId },
    { enabled: currentUser.isAdmin },
  );
  const results = trpc.polls.admin.results.useQuery(
    { pollId },
    { enabled: currentUser.isAdmin },
  );
  const refresh = async () => {
    await Promise.all([
      utils.polls.admin.get.invalidate({ pollId }),
      utils.polls.admin.results.invalidate({ pollId }),
      utils.polls.admin.list.invalidate(),
      utils.polls.list.invalidate(),
    ]);
  };
  const update = trpc.polls.admin.update.useMutation({ onSuccess: refresh });
  const publish = trpc.polls.admin.publish.useMutation({ onSuccess: refresh });
  const archive = trpc.polls.admin.archive.useMutation({ onSuccess: refresh });
  const deleteDraft = trpc.polls.admin.deleteDraft.useMutation({
    async onSuccess() {
      await utils.polls.admin.list.invalidate();
      router.push('/polls/admin');
    },
  });

  if (!currentUser.isAdmin) return <State text={t('polls.admin.forbidden')} />;
  if (poll.isLoading || results.isLoading)
    return <State loading text={t('polls.admin.loading')} />;
  if (poll.isError || results.isError)
    return (
      <State
        text={
          poll.error?.message ?? results.error?.message ?? t('polls.loadError')
        }
      />
    );
  if (!poll.data || !results.data)
    return <State text={t('polls.admin.notFound')} />;

  const data = poll.data;
  const responseCount = results.data.ballotCount;
  const pending =
    update.isPending ||
    publish.isPending ||
    archive.isPending ||
    deleteDraft.isPending;
  const actionError =
    update.error ?? publish.error ?? archive.error ?? deleteDraft.error;
  const voters = results.data.voters;
  const voterColumns: DataTableColumnDef<(typeof voters)[number]>[] = [
    {
      id: 'member',
      header: t('polls.admin.member'),
      cell: ({ row }) => (
        <>
          <p className="font-medium">{row.original.user.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.user.email}
          </p>
        </>
      ),
    },
    {
      id: 'selection',
      header: t('polls.admin.selection'),
      cell: ({ row }) =>
        results.data.options
          .filter((option) => row.original.optionIds.includes(option.id))
          .map((option) => option.label)
          .join(', '),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-3">
            <Link href="/polls/admin">
              <ArrowLeft />
              {t('polls.admin.back')}
            </Link>
          </Button>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight">
            {data.question}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatPollDateTime(data.opensAt, locale)} –{' '}
            {formatPollDateTime(data.closesAt, locale)}
          </p>
        </div>
        <span className="w-fit rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
          {t(`polls.status.${data.status}`)}
        </span>
      </header>
      <div className="flex flex-wrap gap-2">
        {data.status === 'draft' ? (
          <Button disabled={pending} onClick={() => publish.mutate({ pollId })}>
            <Send />
            {t('polls.admin.publish')}
          </Button>
        ) : data.status !== 'archived' ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              if (window.confirm(t('polls.admin.archiveConfirm')))
                archive.mutate({ pollId });
            }}
          >
            <Archive />
            {t('polls.admin.archive')}
          </Button>
        ) : null}
        {data.status === 'draft' ? (
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (window.confirm(t('polls.admin.deleteConfirm')))
                deleteDraft.mutate({ pollId });
            }}
          >
            <Trash2 />
            {t('polls.admin.deleteDraft')}
          </Button>
        ) : null}
      </div>
      {actionError ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {actionError.message}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="h-fit shadow-none">
          <CardHeader>
            <CardTitle>{t('polls.admin.editPoll')}</CardTitle>
            <CardDescription>
              {responseCount > 0
                ? t('polls.admin.ballotFieldsLocked')
                : t('polls.admin.editDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PollForm
              key={`${data.id}-${data.closesAt}`}
              initial={data}
              pending={pending}
              lockBallotFields={responseCount > 0}
              disabled={data.status === 'archived'}
              submitLabel={t('polls.admin.save')}
              onSubmit={(value: PollFormValue) =>
                update.mutate({ pollId, ...value })
              }
            />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>{t('polls.admin.results')}</CardTitle>
              <CardDescription>
                {responseCount}{' '}
                {t(
                  responseCount === 1
                    ? 'polls.admin.ballot'
                    : 'polls.admin.ballots',
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.data.options.map((option) => (
                <div key={option.id}>
                  <div className="mb-1.5 flex justify-between gap-4 text-sm">
                    <span>{option.label}</span>
                    <span className="font-medium">
                      {option.count} · {option.percentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>{t('polls.admin.voters')}</CardTitle>
              <CardDescription>
                {t('polls.admin.votersDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {voters.length ? (
                <DataTable
                  caption={t('polls.admin.voters')}
                  className="min-w-96"
                  columns={voterColumns}
                  data={voters}
                  getRowId={(voter) => voter.user.id}
                  presentation="scroll"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('polls.admin.noVoters')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function State({ text, loading }: { text: string; loading?: boolean }) {
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
