'use client';

import { FileUp, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@repo/ui/components/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import { trpc } from '../trpc';

function mediaUrl(path: string): string {
  return `${(process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3002').replace(/\/+$/, '')}${path}`;
}

export function SponsorhengelContent() {
  const { t } = useI18n();
  const { isAdmin } = useCurrentUser();
  const utils = trpc.useUtils();
  const meta = trpc.sponsorhengel.getMeta.useQuery();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(mediaUrl('/media/sponsorhengel'), {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? response.statusText);
      }
      await utils.sponsorhengel.getMeta.invalidate();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('sponsorhengel.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('sponsorhengel.title')}</h1>
          {meta.data && (
            <p className="mt-1 text-sm text-muted-foreground">
              {meta.data.originalName}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-col items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('sponsorhengel.uploading')}
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  {t('sponsorhengel.upload')}
                </>
              )}
            </Button>
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
          </div>
        )}
      </div>

      {meta.isLoading ? null : meta.data ? (
        <iframe
          src={mediaUrl('/media/sponsorhengel/content')}
          title={meta.data.originalName}
          className="h-[80vh] w-full rounded-lg border"
        />
      ) : (
        <div className="flex h-[80vh] items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">{t('sponsorhengel.empty')}</p>
        </div>
      )}
    </div>
  );
}
