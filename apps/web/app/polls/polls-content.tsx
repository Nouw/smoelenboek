'use client';

import type { PollDto } from '@repo/api';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { CheckCircle2, Loader2, Vote } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '@/lib/i18n';
import { trpc } from '../trpc';
import { formatPollDateTime } from './polls-model';

export function PollsContent() {
  const { t, locale } = useI18n();
  const polls = trpc.polls.list.useQuery();

  if (polls.isLoading) return <PollState loading text={t('polls.loading')} />;
  if (polls.isError) {
    return (
      <PollState
        text={t('polls.loadError')}
        action={
          <Button onClick={() => void polls.refetch()}>
            {t('polls.retry')}
          </Button>
        }
      />
    );
  }
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('polls.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('polls.description')}
        </p>
      </header>
      {polls.data?.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {polls.data.map((poll) => (
            <PollCard key={poll.id} poll={poll} locale={locale} />
          ))}
        </div>
      ) : (
        <PollState text={t('polls.empty')} />
      )}
    </div>
  );
}

function PollCard({ poll, locale }: { poll: PollDto; locale: 'nl' | 'en' }) {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<string[]>(poll.selectedOptionIds);
  const [saved, setSaved] = useState(false);
  const vote = trpc.polls.vote.useMutation({
    async onSuccess(result) {
      setSelected(result.selectedOptionIds);
      setSaved(true);
      await utils.polls.list.invalidate();
    },
  });
  const open = poll.status === 'open';
  const toggle = (optionId: string) => {
    setSaved(false);
    setSelected((current) =>
      poll.choiceMode === 'single_choice'
        ? [optionId]
        : current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
    );
  };

  return (
    <Card className="h-fit shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl leading-snug">
            {poll.question}
          </CardTitle>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {t(`polls.status.${poll.status}`)}
          </span>
        </div>
        <CardDescription>
          {open ? t('polls.openUntil') : t('polls.closedAt')}{' '}
          {formatPollDateTime(poll.closesAt, locale)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset className="space-y-3" disabled={!open || vote.isPending}>
          <legend className="sr-only">{poll.question}</legend>
          {poll.options.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-primary/5 has-disabled:cursor-default"
              >
                <input
                  type={
                    poll.choiceMode === 'single_choice' ? 'radio' : 'checkbox'
                  }
                  name={`poll-${poll.id}`}
                  checked={checked}
                  onChange={() => toggle(option.id)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            );
          })}
        </fieldset>
        {vote.error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {vote.error.message}
          </p>
        ) : null}
        {saved ? (
          <p
            className="mt-3 flex items-center gap-2 text-sm text-emerald-700"
            role="status"
          >
            <CheckCircle2 className="size-4" />
            {t('polls.saved')}
          </p>
        ) : null}
        {open ? (
          <Button
            className="mt-4 w-full"
            disabled={selected.length === 0 || vote.isPending}
            onClick={() =>
              vote.mutate({ pollId: poll.id, optionIds: selected })
            }
          >
            {vote.isPending ? <Loader2 className="animate-spin" /> : <Vote />}
            {poll.selectedOptionIds.length
              ? t('polls.updateVote')
              : t('polls.submitVote')}
          </Button>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {t('polls.personalSelection')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PollState({
  text,
  loading,
  action,
}: {
  text: string;
  loading?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-64 w-full max-w-4xl flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
      {loading ? (
        <Loader2 className="mb-3 size-6 animate-spin text-muted-foreground" />
      ) : (
        <Vote className="mb-3 size-6 text-muted-foreground" />
      )}
      <p className="font-medium">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
