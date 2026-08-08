'use client';

import type { PollChoiceMode, PollDto } from '@repo/api';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { useI18n } from '@/lib/i18n';
import { parseAmsterdamDateTime, toLocalInput } from '../polls-model';

export type PollFormValue = {
  question: string;
  choiceMode: PollChoiceMode;
  opensAt: string;
  closesAt: string;
  options: string[];
};

export function PollForm({
  initial,
  pending,
  lockBallotFields = false,
  disabled = false,
  submitLabel,
  onSubmit,
}: {
  initial?: PollDto;
  pending: boolean;
  lockBallotFields?: boolean;
  disabled?: boolean;
  submitLabel: string;
  onSubmit: (value: PollFormValue) => void;
}) {
  const { t } = useI18n();
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [choiceMode, setChoiceMode] = useState<PollChoiceMode>(
    initial?.choiceMode ?? 'single_choice',
  );
  const [opensAt, setOpensAt] = useState(
    initial ? toLocalInput(initial.opensAt) : '',
  );
  const [closesAt, setClosesAt] = useState(
    initial ? toLocalInput(initial.closesAt) : '',
  );
  const [options, setOptions] = useState(
    initial?.options.map(({ label }) => label) ?? ['', ''],
  );
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const opens = parseAmsterdamDateTime(opensAt);
    const closes = parseAmsterdamDateTime(closesAt);
    const cleaned = options.map((option) => option.trim());
    if (
      !question.trim() ||
      !opens ||
      !closes ||
      opens >= closes ||
      cleaned.some((option) => !option)
    ) {
      setError(t('polls.admin.invalid'));
      return;
    }
    if (
      new Set(cleaned.map((option) => option.toLocaleLowerCase())).size !==
      cleaned.length
    ) {
      setError(t('polls.admin.duplicateOptions'));
      return;
    }
    setError(null);
    onSubmit({
      question: question.trim(),
      choiceMode,
      opensAt: opens.toISOString(),
      closesAt: closes.toISOString(),
      options: cleaned,
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <fieldset disabled={disabled || pending} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`question-${initial?.id ?? 'new'}`}>
            {t('polls.admin.question')}
          </Label>
          <textarea
            id={`question-${initial?.id ?? 'new'}`}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            disabled={lockBallotFields}
            required
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`mode-${initial?.id ?? 'new'}`}>
            {t('polls.admin.choiceMode')}
          </Label>
          <select
            id={`mode-${initial?.id ?? 'new'}`}
            value={choiceMode}
            onChange={(event) =>
              setChoiceMode(event.target.value as PollChoiceMode)
            }
            disabled={lockBallotFields}
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-50"
          >
            <option value="single_choice">
              {t('polls.admin.singleChoice')}
            </option>
            <option value="multiple_choice">
              {t('polls.admin.multipleChoice')}
            </option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`opens-${initial?.id ?? 'new'}`}>
              {t('polls.admin.opensAt')}
            </Label>
            <Input
              id={`opens-${initial?.id ?? 'new'}`}
              type="datetime-local"
              value={opensAt}
              onChange={(event) => setOpensAt(event.target.value)}
              disabled={lockBallotFields}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`closes-${initial?.id ?? 'new'}`}>
              {t('polls.admin.closesAt')}
            </Label>
            <Input
              id={`closes-${initial?.id ?? 'new'}`}
              type="datetime-local"
              value={closesAt}
              onChange={(event) => setClosesAt(event.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>{t('polls.admin.options')}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={lockBallotFields || options.length >= 20}
              onClick={() => setOptions((current) => [...current, ''])}
            >
              <Plus /> {t('polls.admin.addOption')}
            </Button>
          </div>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option}
                maxLength={200}
                aria-label={`${t('polls.admin.option')} ${index + 1}`}
                onChange={(event) =>
                  setOptions((current) =>
                    current.map((value, optionIndex) =>
                      optionIndex === index ? event.target.value : value,
                    ),
                  )
                }
                disabled={lockBallotFields}
                required
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={t('polls.admin.removeOption')}
                disabled={lockBallotFields || options.length <= 2}
                onClick={() =>
                  setOptions((current) =>
                    current.filter((_, optionIndex) => optionIndex !== index),
                  )
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={disabled || pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
