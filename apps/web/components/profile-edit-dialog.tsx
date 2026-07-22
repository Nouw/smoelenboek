'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from '@repo/ui/components/input';
import { Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { authClient } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import { trpc } from '@/app/trpc';

const profileFormSchema = z.object({
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type ProfileEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileEditDialog({
  open,
  onOpenChange,
}: ProfileEditDialogProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'error'; message: string }
    | { kind: 'success'; emailChanged: boolean; imageUrlChanged: boolean }
  >({ kind: 'idle' });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'uploading' }
    | { kind: 'deleting' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const user = trpc.user.me.useQuery(undefined, {
    enabled: open,
    retry: false,
  });
  const imageBusy =
    imageStatus.kind === 'uploading' || imageStatus.kind === 'deleting';

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
      email: user.data?.email ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      setImageUrl(user.data?.imageUrl ?? null);
      setImageStatus({ kind: 'idle' });
    }
  }, [open, user.data?.imageUrl]);

  async function onSubmit(values: ProfileFormValues) {
    setStatus({ kind: 'submitting' });

    const currentEmail = user.data?.email ?? '';
    const emailChanged = values.email !== currentEmail;

    if (!emailChanged) {
      setStatus({ kind: 'idle' });
      onOpenChange(false);
      return;
    }

    try {
      if (emailChanged) {
        await authClient.changeEmail({
          newEmail: values.email,
          callbackURL: '/',
        });
      }

      await user.refetch();

      setStatus({
        kind: 'success',
        emailChanged,
        imageUrlChanged: false,
      });

      setTimeout(() => {
        onOpenChange(false);
        setStatus({ kind: 'idle' });
      }, 3000);
    } catch (error) {
      setStatus({
        kind: 'error',
        message:
          error instanceof Error ? error.message : t('profile.updateFailed'),
      });
    }
  }

  async function uploadProfileImage(file: File) {
    setImageStatus({ kind: 'uploading' });
    setStatus({ kind: 'idle' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${rpcBaseUrl()}/media/profile-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const body = (await response.json()) as { imageUrl?: string; message?: string };

      if (!response.ok || !body.imageUrl) {
        throw new Error(body.message ?? t('profile.uploadPictureFailed'));
      }

      setImageUrl(body.imageUrl);
      await authClient.updateUser({ image: body.imageUrl });
      await user.refetch();
      setImageStatus({ kind: 'idle' });
    } catch (error) {
      setImageStatus({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : t('profile.uploadPictureFailed'),
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function deleteProfileImage() {
    setImageStatus({ kind: 'deleting' });
    setStatus({ kind: 'idle' });

    try {
      const response = await fetch(`${rpcBaseUrl()}/media/profile-image`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? t('profile.removePictureFailed'));
      }

      setImageUrl(null);
      await authClient.updateUser({ image: null });
      await user.refetch();
      setImageStatus({ kind: 'idle' });
    } catch (error) {
      setImageStatus({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : t('profile.removePictureFailed'),
      });
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('profile.editProfile')}</DialogTitle>
          <DialogDescription>
            {t('profile.updateProfileDescription')}
          </DialogDescription>
        </DialogHeader>

        {status.kind === 'success' ? (
          <div className="space-y-2 py-4">
            {status.imageUrlChanged && (
              <p className="text-sm">{t('profile.pictureUpdated')}</p>
            )}
            {status.emailChanged && (
              <p className="text-sm">
                {t('profile.verificationEmailSent')}
              </p>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profile.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('profile.emailDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>{t('profile.imageLabel')}</FormLabel>
                <div className="flex flex-col items-start gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-medium text-accent-foreground">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      'U'
                    )}
                  </div>
                  <div className="grid w-full min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];

                        if (file) {
                          void uploadProfileImage(file);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-h-9 min-w-0 whitespace-normal"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageBusy}
                    >
                      <Upload className="size-4" />
                      {imageStatus.kind === 'uploading'
                        ? t('profile.uploadingPicture')
                        : t('profile.uploadPicture')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-h-9 min-w-0 whitespace-normal"
                      onClick={() => void deleteProfileImage()}
                      disabled={!imageUrl || imageBusy}
                    >
                      <Trash2 className="size-4" />
                      {imageStatus.kind === 'deleting'
                        ? t('profile.deletingPicture')
                        : t('profile.deletePicture')}
                    </Button>
                  </div>
                </div>
                {imageStatus.kind === 'error' ? (
                  <p className="text-destructive-foreground text-sm">
                    {imageStatus.message}
                  </p>
                ) : null}
              </div>

              {status.kind === 'error' && (
                <p className="text-destructive-foreground text-sm">
                  {status.message}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={status.kind === 'submitting'}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    status.kind === 'submitting' || imageBusy
                  }
                >
                  {status.kind === 'submitting'
                    ? t('profile.saving')
                    : t('profile.saveChanges')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function rpcBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3002'
  ).replace(/\/+$/, '');
}
