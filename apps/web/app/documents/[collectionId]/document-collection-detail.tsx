'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
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
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  ImageIcon,
  Loader2,
  MoreVertical,
  Pencil,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { trpc } from '../../trpc';
import { ConfirmDeleteDialog, mediaUrl, StatePanel, type CollectionKind } from '../document-ui';

type Asset = {
  id: string;
  collectionId: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  title: string | null;
  caption: string | null;
  position: number;
  hasThumbnail: boolean;
  createdAt: string | Date;
};

type CollectionDetail = {
  id: string;
  name: string;
  description: string | null;
  kind: CollectionKind;
  seasonKey: number;
  coverAssetId: string | null;
  assets: Asset[];
};

type UploadItem = { name: string; state: 'queued' | 'uploading' | 'done' | 'error'; error?: string };

export function DocumentCollectionDetail({ collectionId }: { collectionId: string }) {
  const { t, locale } = useI18n();
  const currentUser = useCurrentUser();
  const utils = trpc.useUtils();
  const collectionQuery = trpc.documents.getCollection.useQuery({ collectionId }, { retry: false });
  const [filter, setFilter] = useState('');
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState<Asset | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const refresh = () => utils.documents.getCollection.invalidate({ collectionId });

  const updateAsset = trpc.documents.updateAsset.useMutation({
    async onSuccess() { setEditing(null); setActionError(null); await refresh(); },
    onError(error) { setActionError(error.message); },
  });
  const deleteAsset = trpc.documents.deleteAsset.useMutation({
    async onSuccess() { setDeleting(null); setActionError(null); await refresh(); },
    onError(error) { setActionError(error.message); },
  });
  const setCover = trpc.documents.setCoverAsset.useMutation({
    async onSuccess() { setActionError(null); await refresh(); },
    onError(error) { setActionError(error.message); },
  });
  const reorderAssets = trpc.documents.reorderAssets.useMutation({
    async onSuccess() { setActionError(null); await refresh(); },
    onError(error) { setActionError(error.message); },
  });

  const collection = collectionQuery.data as CollectionDetail | undefined;
  const orderedAssets = useMemo(
    () => [...(collection?.assets ?? [])].sort((left, right) => left.position - right.position),
    [collection?.assets],
  );
  const visibleAssets = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase();
    return orderedAssets.filter((asset) =>
      `${asset.title ?? ''} ${asset.caption ?? ''} ${asset.originalName}`
        .toLocaleLowerCase()
        .includes(needle),
    );
  }, [filter, orderedAssets]);
  const lightboxIndex = orderedAssets.findIndex(({ id }) => id === lightboxId);

  useEffect(() => {
    if (!lightboxId) return;
    function keydown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxId(orderedAssets[lightboxIndex - 1]!.id);
      if (event.key === 'ArrowRight' && lightboxIndex < orderedAssets.length - 1) setLightboxId(orderedAssets[lightboxIndex + 1]!.id);
      if (event.key === 'Escape') setLightboxId(null);
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [lightboxId, lightboxIndex, orderedAssets]);

  if (collectionQuery.isLoading) return <StatePanel loading>{t('documents.loadingCollection')}</StatePanel>;
  if (collectionQuery.isError) return <StatePanel error={collectionQuery.error.message} onRetry={() => void collectionQuery.refetch()} />;
  if (!collection) return <StatePanel>{t('documents.notFound')}</StatePanel>;

  function move(asset: Asset, direction: -1 | 1) {
    const from = orderedAssets.findIndex(({ id }) => id === asset.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= orderedAssets.length) return;
    const reordered = [...orderedAssets];
    [reordered[from], reordered[to]] = [reordered[to]!, reordered[from]!];
    reorderAssets.mutate({ collectionId, assetIds: reordered.map(({ id }) => id) });
  }

  async function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (files.length === 0) return;
    setActionError(null);
    setUploads(files.map((file) => ({ name: file.name, state: 'queued' })));

    let cursor = 0;
    async function worker() {
      while (cursor < files.length) {
        const index = cursor++;
        const file = files[index]!;
        setUploads((items) => replaceUpload(items, index, { name: file.name, state: 'uploading' }));
        try {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch(mediaUrl(`/media/collections/${collectionId}/assets`), {
            method: 'POST', credentials: 'include', body: formData,
          });
          if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as { message?: string };
            throw new Error(body.message ?? t('documents.uploadFailed'));
          }
          setUploads((items) => replaceUpload(items, index, { name: file.name, state: 'done' }));
        } catch (error) {
          setUploads((items) => replaceUpload(items, index, {
            name: file.name,
            state: 'error',
            error: error instanceof Error ? error.message : t('documents.uploadFailed'),
          }));
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, files.length) }, () => worker()));
    await refresh();
  }

  const isPhotoAlbum = collection.kind === 'photo_album';
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Button asChild variant="ghost" className="-ml-3"><Link href="/documents"><ArrowLeft /> {t('documents.back')}</Link></Button>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">{collection.seasonKey}/{collection.seasonKey + 1}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{collection.name}</h1>
          {collection.description ? <p className="max-w-3xl text-sm text-muted-foreground">{collection.description}</p> : null}
        </div>
        {currentUser.isAdmin ? (
          <>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="sr-only"
              accept={isPhotoAlbum ? 'image/jpeg,image/png,image/webp,image/gif' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/jpeg,image/png,image/webp,image/gif'}
              onChange={(event) => void chooseFiles(event)}
            />
            <Button type="button" onClick={() => fileInput.current?.click()}><Upload /> {t('documents.upload')}</Button>
          </>
        ) : null}
      </header>

      {uploads.length > 0 ? (
        <section className="rounded-lg border p-4" aria-live="polite" aria-label={t('documents.uploadProgress')}>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{t('documents.uploadProgress')}</h2><Button type="button" variant="ghost" size="icon" onClick={() => setUploads([])} aria-label={t('documents.dismiss')}><X /></Button></div>
          <ul className="space-y-2 text-sm">
            {uploads.map((upload, index) => (
              <li key={`${upload.name}-${index}`} className="flex items-center justify-between gap-3">
                <span className="truncate">{upload.name}</span>
                <span className={upload.state === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
                  {upload.state === 'uploading' ? <Loader2 className="size-4 animate-spin" /> : upload.error ?? t(`documents.uploadState.${upload.state}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {actionError ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{actionError}</p> : null}

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={t('documents.filterFiles')} aria-label={t('documents.filterFiles')} className="pl-9" />
      </div>

      {visibleAssets.length === 0 ? (
        <StatePanel>{filter ? t('documents.noSearchResults') : t('documents.emptyCollection')}</StatePanel>
      ) : isPhotoAlbum ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleAssets.map((asset) => (
            <div key={asset.id} className="group relative overflow-hidden rounded-lg border bg-muted">
              <button type="button" onClick={() => setLightboxId(asset.id)} className="relative block aspect-square w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-label={`${t('documents.openPhoto')}: ${asset.title ?? asset.originalName}`}>
                <span className="absolute inset-0 flex items-center justify-center"><ImageIcon className="size-9 text-muted-foreground" /></span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(`/media/assets/${asset.id}/thumbnail`)} alt={asset.caption ?? asset.title ?? ''} className="relative h-full w-full object-cover transition-transform group-hover:scale-[1.02]" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
              </button>
              {(asset.title || asset.caption) ? <div className="absolute inset-x-0 bottom-0 bg-black/65 p-2 text-xs text-white"><p className="truncate font-medium">{asset.title ?? asset.caption}</p></div> : null}
              {currentUser.isAdmin ? <AssetMenu asset={asset} index={orderedAssets.indexOf(asset)} total={orderedAssets.length} isCover={collection.coverAssetId === asset.id} pending={reorderAssets.isPending || setCover.isPending} onEdit={() => setEditing(asset)} onDelete={() => setDeleting(asset)} onMove={(direction) => move(asset, direction)} onCover={() => setCover.mutate({ collectionId, assetId: collection.coverAssetId === asset.id ? null : asset.id })} /> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAssets.map((asset) => {
            const Icon = fileIcon(asset.mimeType);
            return (
              <Card key={asset.id} className="relative py-0 shadow-none">
                <CardContent className="flex items-center gap-4 p-4 pr-14">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {asset.hasThumbnail ? <FileImage className="size-5" /> : <Icon className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium">{asset.title ?? asset.originalName}</h2>
                    {asset.title ? <p className="truncate text-xs text-muted-foreground">{asset.originalName}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">{formatBytes(asset.byteSize)} · {dateFormatter.format(new Date(asset.createdAt))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(asset.mimeType === 'application/pdf' || asset.mimeType.startsWith('image/')) ? <Button asChild variant="outline" size="sm"><a href={mediaUrl(`/media/assets/${asset.id}/content`)} target="_blank" rel="noreferrer"><ExternalLink /><span className="sr-only sm:not-sr-only">{t('documents.preview')}</span></a></Button> : null}
                    <Button asChild variant="outline" size="sm"><a href={mediaUrl(`/media/assets/${asset.id}/content?download=1`)}><Download /><span className="sr-only sm:not-sr-only">{t('documents.download')}</span></a></Button>
                  </div>
                </CardContent>
                {currentUser.isAdmin ? <AssetMenu asset={asset} index={orderedAssets.indexOf(asset)} total={orderedAssets.length} isCover={false} pending={reorderAssets.isPending} onEdit={() => setEditing(asset)} onDelete={() => setDeleting(asset)} onMove={(direction) => move(asset, direction)} /> : null}
              </Card>
            );
          })}
        </div>
      )}

      {lightboxIndex >= 0 ? <Lightbox asset={orderedAssets[lightboxIndex]!} index={lightboxIndex} total={orderedAssets.length} onClose={() => setLightboxId(null)} onPrevious={() => setLightboxId(orderedAssets[lightboxIndex - 1]!.id)} onNext={() => setLightboxId(orderedAssets[lightboxIndex + 1]!.id)} /> : null}
      {editing ? <EditAssetDialog asset={editing} pending={updateAsset.isPending} error={actionError} onClose={() => setEditing(null)} onSubmit={(value) => updateAsset.mutate({ assetId: editing.id, ...value })} /> : null}
      {deleting ? <ConfirmDeleteDialog open onOpenChange={(open) => { if (!open) setDeleting(null); }} title={t('documents.deleteFile')} description={t('documents.deleteFileWarning')} pending={deleteAsset.isPending} onConfirm={() => deleteAsset.mutate({ assetId: deleting.id })} /> : null}
    </div>
  );
}

function AssetMenu({ asset, index, total, isCover, pending, onEdit, onDelete, onMove, onCover }: { asset: Asset; index: number; total: number; isCover: boolean; pending: boolean; onEdit: () => void; onDelete: () => void; onMove: (direction: -1 | 1) => void; onCover?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="absolute right-2 top-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="secondary" size="icon" aria-label={`${t('documents.fileActions')}: ${asset.originalName}`}><MoreVertical /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}><Pencil /> {t('documents.edit')}</DropdownMenuItem>
          {onCover ? <DropdownMenuItem onSelect={onCover}><Star /> {t(isCover ? 'documents.removeCover' : 'documents.setCover')}</DropdownMenuItem> : null}
          <DropdownMenuItem disabled={index === 0 || pending} onSelect={() => onMove(-1)}><ArrowUp /> {t('documents.moveUp')}</DropdownMenuItem>
          <DropdownMenuItem disabled={index === total - 1 || pending} onSelect={() => onMove(1)}><ArrowDown /> {t('documents.moveDown')}</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 /> {t('documents.delete')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Lightbox({ asset, index, total, onClose, onPrevious, onNext }: { asset: Asset; index: number; total: number; onClose: () => void; onPrevious: () => void; onNext: () => void }) {
  const { t } = useI18n();
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => setImageState('loading'), [asset.id]);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[95svh] max-w-[95vw] overflow-hidden border-0 bg-black p-0 text-white sm:max-w-[95vw]" showCloseButton={false} aria-describedby="lightbox-caption">
        <DialogTitle className="sr-only">{asset.title ?? asset.originalName}</DialogTitle>
        <div className="relative flex min-h-[70svh] items-center justify-center">
          <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-3 z-10" onClick={onClose} aria-label={t('documents.close')}><X /></Button>
          <Button type="button" variant="secondary" size="icon" className="absolute left-3 z-10" disabled={index === 0} onClick={onPrevious} aria-label={t('documents.previous')}><ChevronLeft /></Button>
          {imageState === 'loading' ? <Loader2 className="size-8 animate-spin text-white/75" aria-label={t('documents.loadingCollection')} /> : null}
          {imageState === 'error' ? <p className="px-16 text-center text-sm text-white/75" role="alert">{t('documents.previewUnavailable')}</p> : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(`/media/assets/${asset.id}/content`)} alt={asset.caption ?? asset.title ?? ''} onLoad={() => setImageState('ready')} onError={() => setImageState('error')} className={`max-h-[82svh] max-w-full object-contain ${imageState === 'error' ? 'hidden' : ''}`} />
          <Button type="button" variant="secondary" size="icon" className="absolute right-3 z-10" disabled={index === total - 1} onClick={onNext} aria-label={t('documents.next')}><ChevronRight /></Button>
          <div id="lightbox-caption" className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/90 to-transparent p-5 pt-16">
            <div><p className="font-medium">{asset.title ?? asset.originalName}</p>{asset.caption ? <p className="mt-1 text-sm text-white/75">{asset.caption}</p> : null}<p className="mt-1 text-xs text-white/60">{index + 1} / {total}</p></div>
            <Button asChild variant="secondary"><a href={mediaUrl(`/media/assets/${asset.id}/content?download=1`)}><Download /> {t('documents.download')}</a></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditAssetDialog({ asset, pending, error, onClose, onSubmit }: { asset: Asset; pending: boolean; error: string | null; onClose: () => void; onSubmit: (value: { title: string | null; caption: string | null }) => void }) {
  const { t } = useI18n();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({ title: nullable(data.get('title')), caption: nullable(data.get('caption')) });
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('documents.editFile')}</DialogTitle><DialogDescription>{asset.originalName}</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label htmlFor="asset-title">{t('documents.fileTitle')}</Label><Input id="asset-title" name="title" defaultValue={asset.title ?? ''} maxLength={160} /></div>
          <div className="space-y-2"><Label htmlFor="asset-caption">{t('documents.caption')}</Label><textarea id="asset-caption" name="caption" defaultValue={asset.caption ?? ''} maxLength={500} className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : null}{t('documents.save')}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function replaceUpload(items: UploadItem[], index: number, item: UploadItem): UploadItem[] {
  return items.map((existing, itemIndex) => itemIndex === index ? item : existing);
}

function nullable(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim();
  return text === '' ? null : text;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return FileType;
  if (mimeType.startsWith('image/')) return ImageIcon;
  return File;
}
