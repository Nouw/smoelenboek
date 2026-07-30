'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import {
  ArrowDown,
  ArrowUp,
  FileText,
  FolderOpen,
  ImageIcon,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { trpc } from '../trpc';
import {
  CollectionFormDialog,
  ConfirmDeleteDialog,
  mediaUrl,
  StatePanel,
  type CollectionKind,
} from './document-ui';

type Collection = {
  id: string;
  name: string;
  description: string | null;
  kind: CollectionKind;
  seasonKey: number;
  position: number;
  coverAssetId: string | null;
  assetCount: number;
};

export function DocumentsContent() {
  const { t } = useI18n();
  const currentUser = useCurrentUser();
  const utils = trpc.useUtils();
  const collections = trpc.documents.listCollections.useQuery({});
  const seasons = trpc.seasons.list.useQuery();
  const [kind, setKind] = useState<CollectionKind>('photo_album');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Collection | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Collection | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => utils.documents.listCollections.invalidate();
  const mutationOptions = {
    async onSuccess() {
      setEditing(null);
      setDeleting(null);
      setActionError(null);
      await refresh();
    },
    onError(error: { message: string }) {
      setActionError(error.message);
    },
  };
  const createCollection = trpc.documents.createCollection.useMutation(mutationOptions);
  const updateCollection = trpc.documents.updateCollection.useMutation(mutationOptions);
  const deleteCollection = trpc.documents.deleteCollection.useMutation(mutationOptions);
  const reorderCollections = trpc.documents.reorderCollections.useMutation({
    async onSuccess() {
      setActionError(null);
      await refresh();
    },
    onError(error) {
      setActionError(error.message);
    },
  });

  const grouped = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase();
    const visible = ((collections.data ?? []) as Collection[])
      .filter((collection) => collection.kind === kind)
      .filter((collection) =>
        `${collection.name} ${collection.description ?? ''}`
          .toLocaleLowerCase()
          .includes(needle),
      )
      .sort((left, right) =>
        right.seasonKey - left.seasonKey || left.position - right.position,
      );
    return visible.reduce((groups, collection) => {
      const entries = groups.get(collection.seasonKey) ?? [];
      entries.push(collection);
      groups.set(collection.seasonKey, entries);
      return groups;
    }, new Map<number, Collection[]>());
  }, [collections.data, filter, kind]);

  function move(collection: Collection, direction: -1 | 1) {
    const siblings = orderedSiblings(collection);
    const from = siblings.findIndex((candidate) => candidate.id === collection.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[from], reordered[to]] = [reordered[to]!, reordered[from]!];
    reorderCollections.mutate({
      seasonKey: collection.seasonKey,
      kind: collection.kind,
      collectionIds: reordered.map(({ id }) => id),
    });
  }

  function orderedSiblings(collection: Collection) {
    return ((collections.data ?? []) as Collection[])
      .filter(
        (candidate) =>
          candidate.kind === collection.kind &&
          candidate.seasonKey === collection.seasonKey,
      )
      .sort((left, right) => left.position - right.position);
  }

  if (collections.isLoading || seasons.isLoading) {
    return <StatePanel loading>{t('documents.loading')}</StatePanel>;
  }
  if (collections.isError || seasons.isError) {
    return (
      <StatePanel
        error={collections.error?.message ?? seasons.error?.message}
        onRetry={() => {
          void collections.refetch();
          void seasons.refetch();
        }}
      />
    );
  }

  const availableSeasons = seasons.data ?? [];
  const seasonLabels = new Map(availableSeasons.map((season) => [season.key, season.label]));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('documents.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('documents.intro')}</p>
        </div>
        {currentUser.isAdmin ? (
          <Button type="button" onClick={() => { setActionError(null); setEditing('new'); }}>
            <Plus /> {t('documents.newCollection')}
          </Button>
        ) : null}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-lg bg-muted p-1" role="tablist" aria-label={t('documents.collectionType')}>
          {(['photo_album', 'document_library'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={kind === tab}
              onClick={() => setKind(tab)}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm"
            >
              {tab === 'photo_album' ? t('documents.photos') : t('documents.files')}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={t('documents.filterCollections')}
            aria-label={t('documents.filterCollections')}
            className="pl-9"
          />
        </div>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      {grouped.size === 0 ? (
        <StatePanel>{filter ? t('documents.noSearchResults') : t('documents.empty')}</StatePanel>
      ) : (
        [...grouped.entries()].map(([seasonKey, entries]) => (
          <section key={seasonKey} className="space-y-3" aria-labelledby={`season-${seasonKey}`}>
            <div className="flex items-center gap-3">
              <h2 id={`season-${seasonKey}`} className="text-xl font-semibold">
                {seasonLabels.get(seasonKey) ?? `${seasonKey}/${seasonKey + 1}`}
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{entries.length}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((collection) => {
                const siblings = orderedSiblings(collection);
                const siblingIndex = siblings.findIndex(({ id }) => id === collection.id);
                return (
                <Card key={collection.id} className="group relative overflow-hidden py-0 shadow-none">
                  <Link
                    href={`/documents/${collection.id}`}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    {collection.kind === 'photo_album' ? (
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                        {collection.coverAssetId ? (
                          <>
                            <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="size-10 text-muted-foreground" /></div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={mediaUrl(`/media/assets/${collection.coverAssetId}/thumbnail`)}
                              alt=""
                              className="relative h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                              onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            />
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center"><ImageIcon className="size-10 text-muted-foreground" /></div>
                        )}
                      </div>
                    ) : null}
                    <CardContent className="flex min-h-36 flex-col justify-between gap-4 p-5">
                      <div>
                        <div className="flex items-start gap-3">
                          {collection.kind === 'document_library' ? <FolderOpen className="mt-0.5 size-5 shrink-0 text-primary" /> : null}
                          <h3 className="font-semibold">{collection.name}</h3>
                        </div>
                        {collection.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{collection.description}</p> : null}
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="size-3.5" />
                        {collection.assetCount} {t(collection.assetCount === 1 ? 'documents.item' : 'documents.items')}
                      </p>
                    </CardContent>
                  </Link>
                  {currentUser.isAdmin ? (
                    <div className="absolute right-2 top-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" aria-label={t('documents.collectionActions')}><MoreVertical /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => { setActionError(null); setEditing(collection); }}><Pencil /> {t('documents.edit')}</DropdownMenuItem>
                          <DropdownMenuItem disabled={siblingIndex <= 0 || reorderCollections.isPending} onSelect={() => move(collection, -1)}><ArrowUp /> {t('documents.moveUp')}</DropdownMenuItem>
                          <DropdownMenuItem disabled={siblingIndex < 0 || siblingIndex === siblings.length - 1 || reorderCollections.isPending} onSelect={() => move(collection, 1)}><ArrowDown /> {t('documents.moveDown')}</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(collection)}><Trash2 /> {t('documents.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : null}
                </Card>
                );
              })}
            </div>
          </section>
        ))
      )}

      {editing ? (
        <CollectionFormDialog
          key={editing === 'new' ? 'new' : editing.id}
          open
          onOpenChange={(open) => { if (!open) setEditing(null); }}
          seasons={availableSeasons}
          initial={editing === 'new' ? undefined : editing}
          pending={createCollection.isPending || updateCollection.isPending}
          error={actionError}
          onSubmit={(value) => {
            setActionError(null);
            if (!value.name || !Number.isInteger(value.seasonKey)) {
              setActionError(t('documents.invalidCollection'));
              return;
            }
            if (editing === 'new') createCollection.mutate(value);
            else updateCollection.mutate({ collectionId: editing.id, name: value.name, description: value.description, seasonKey: value.seasonKey });
          }}
        />
      ) : null}
      {deleting ? (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open) => { if (!open) setDeleting(null); }}
          title={t('documents.deleteCollection')}
          description={t('documents.deleteCollectionWarning')}
          pending={deleteCollection.isPending}
          onConfirm={() => deleteCollection.mutate({ collectionId: deleting.id })}
        />
      ) : null}
    </div>
  );
}
