'use client';

import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

import { useI18n } from '@/lib/i18n';

export type CollectionKind = 'photo_album' | 'document_library';

export function StatePanel({
  loading,
  error,
  onRetry,
  children,
}: {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div
      className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-5 text-center text-sm text-muted-foreground"
      role={error ? 'alert' : 'status'}
    >
      {loading ? <Loader2 className="size-6 animate-spin" /> : null}
      {error ? <AlertCircle className="size-7 text-destructive" /> : null}
      <p className={error ? 'text-destructive' : undefined}>
        {error ?? children}
      </p>
      {error && onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCw /> {t('documents.retry')}
        </Button>
      ) : null}
    </div>
  );
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  seasons,
  initial,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasons: { key: number; label: string }[];
  initial?: {
    name: string;
    description: string | null;
    kind: CollectionKind;
    seasonKey: number;
  };
  pending: boolean;
  error?: string | null;
  onSubmit: (value: {
    name: string;
    description: string | null;
    kind: CollectionKind;
    seasonKey: number;
  }) => void;
}) {
  const { t } = useI18n();
  const [kind, setKind] = useState<CollectionKind>(
    initial?.kind ?? 'photo_album',
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      name: String(data.get('name') ?? '').trim(),
      description: emptyToNull(String(data.get('description') ?? '')),
      kind,
      seasonKey: Number(data.get('seasonKey')),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(initial ? 'documents.editCollection' : 'documents.newCollection')}
          </DialogTitle>
          <DialogDescription>{t('documents.collectionFormHelp')}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="collection-name">{t('documents.name')}</Label>
            <Input
              id="collection-name"
              name="name"
              defaultValue={initial?.name}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-description">
              {t('documents.description')}
            </Label>
            <textarea
              id="collection-description"
              name="description"
              defaultValue={initial?.description ?? ''}
              maxLength={500}
              className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="collection-kind">{t('documents.type')}</Label>
              <select
                id="collection-kind"
                value={kind}
                disabled={Boolean(initial)}
                onChange={(event) => setKind(event.target.value as CollectionKind)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="photo_album">{t('documents.photos')}</option>
                <option value="document_library">{t('documents.files')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-season">{t('documents.season')}</Label>
              <select
                id="collection-season"
                name="seasonKey"
                defaultValue={initial?.seasonKey ?? seasons[0]?.key}
                required
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {seasons.map((season) => (
                  <option key={season.key} value={season.key}>
                    {season.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={pending || seasons.length === 0}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {t('documents.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">{t('common.cancel')}</Button>
          </DialogClose>
          <Button type="button" variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {t('documents.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function mediaUrl(path: string): string {
  return `${(process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3002').replace(/\/+$/, '')}${path}`;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
