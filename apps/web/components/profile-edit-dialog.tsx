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
import { Input } from '@repo/ui/components/input';
import { Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '@/app/trpc';
import { useCurrentUser } from '@/hooks/use-current-user';
import { authClient } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';

type ProfileEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onSaved?: () => void | Promise<void>;
};

const optionalText = (maximumLength: number) =>
  z.string().trim().max(maximumLength);

const baseProfileFormSchema = z.object({
  email: z.union([z.literal(''), z.string().email()]),
  streetName: optionalText(128),
  houseNumber: optionalText(32),
  postcode: optionalText(16),
  city: optionalText(128),
  phoneNumber: optionalText(32),
  bankAccountNumber: optionalText(64),
  backNumber: z.string().trim(),
});

type ProfileFormValues = z.infer<typeof baseProfileFormSchema>;

export function ProfileEditDialog({
  open,
  onOpenChange,
  userId,
  onSaved,
}: ProfileEditDialogProps) {
  const { t } = useI18n();
  const currentUser = useCurrentUser();
  const targetUserId = userId ?? currentUser.user?.id;
  const canEditAccount = Boolean(
    targetUserId && currentUser.isOwner(targetUserId),
  );
  const canEditInformation = Boolean(
    targetUserId && (currentUser.isOwner(targetUserId) || currentUser.isAdmin),
  );
  const information = trpc.user.information.useQuery(
    targetUserId ? { userId: targetUserId } : undefined,
    {
      enabled: open && canEditInformation,
      retry: false,
    },
  );
  const updateInformation = trpc.user.updateInformation.useMutation();
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'error'; message: string }
    | {
        kind: 'success';
        emailChanged: boolean;
        informationChanged: boolean;
      }
  >({ kind: 'idle' });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'uploading' }
    | { kind: 'deleting' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageBusy =
    imageStatus.kind === 'uploading' || imageStatus.kind === 'deleting';
  const formSchema = useMemo(
    () =>
      baseProfileFormSchema.refine(
        ({ backNumber }) =>
          backNumber === '' ||
          (/^\d+$/.test(backNumber) && Number(backNumber) <= 32767),
        {
          message: t('profile.invalidBackNumber'),
          path: ['backNumber'],
        },
      ),
    [t],
  );
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    values: toFormValues(currentUser.user?.email, information.data),
  });

  useEffect(() => {
    if (open) {
      setImageUrl(canEditAccount ? (currentUser.user?.imageUrl ?? null) : null);
      setImageStatus({ kind: 'idle' });
      setStatus({ kind: 'idle' });
    }
  }, [canEditAccount, currentUser.user?.imageUrl, open]);

  async function onSubmit(values: ProfileFormValues) {
    if (!targetUserId || !canEditInformation) {
      return;
    }

    setStatus({ kind: 'submitting' });
    const currentEmail = currentUser.user?.email ?? '';
    const emailChanged = canEditAccount && values.email !== currentEmail;

    try {
      if (emailChanged) {
        await authClient.changeEmail({
          newEmail: values.email,
          callbackURL: '/',
        });
      }

      await updateInformation.mutateAsync({
        userId: targetUserId,
        changes: {
          streetName: emptyToNull(values.streetName),
          houseNumber: emptyToNull(values.houseNumber),
          postcode: emptyToNull(values.postcode),
          city: emptyToNull(values.city),
          phoneNumber: emptyToNull(values.phoneNumber),
          bankAccountNumber: emptyToNull(values.bankAccountNumber),
          backNumber:
            values.backNumber === '' ? null : Number(values.backNumber),
        },
      });

      await Promise.all([
        currentUser.refetch(),
        information.refetch(),
        Promise.resolve(onSaved?.()),
      ]);
      setStatus({
        kind: 'success',
        emailChanged,
        informationChanged: true,
      });

      setTimeout(() => {
        onOpenChange(false);
        setStatus({ kind: 'idle' });
      }, 2000);
    } catch (error) {
      setStatus({
        kind: 'error',
        message:
          error instanceof Error ? error.message : t('profile.updateFailed'),
      });
    }
  }

  async function uploadProfileImage(file: File) {
    if (!canEditAccount) {
      return;
    }

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
      const body = (await response.json()) as {
        imageUrl?: string;
        message?: string;
      };

      if (!response.ok || !body.imageUrl) {
        throw new Error(body.message ?? t('profile.uploadPictureFailed'));
      }

      setImageUrl(body.imageUrl);
      await authClient.updateUser({ image: body.imageUrl });
      await Promise.all([
        currentUser.refetch(),
        Promise.resolve(onSaved?.()),
      ]);
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
    if (!canEditAccount) {
      return;
    }

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
      await Promise.all([
        currentUser.refetch(),
        Promise.resolve(onSaved?.()),
      ]);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('profile.editProfile')}</DialogTitle>
          <DialogDescription>
            {t('profile.updateProfileDescription')}
          </DialogDescription>
        </DialogHeader>

        {status.kind === 'success' ? (
          <div className="space-y-2 py-4" role="status">
            {status.informationChanged ? (
              <p className="text-sm">{t('profile.informationUpdated')}</p>
            ) : null}
            {status.emailChanged ? (
              <p className="text-sm">
                {t('profile.verificationEmailSent')}
              </p>
            ) : null}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {canEditAccount ? (
                <fieldset className="space-y-4">
                  <legend className="text-sm font-medium">
                    {t('profile.account')}
                  </legend>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profile.emailLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
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
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-medium text-accent-foreground">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt=""
                            className="size-full object-cover"
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
                      <p className="text-sm text-destructive" role="alert">
                        {imageStatus.message}
                      </p>
                    ) : null}
                  </div>
                </fieldset>
              ) : null}

              <fieldset
                className={canEditAccount ? 'space-y-4 border-t pt-5' : 'space-y-4'}
              >
                <legend className="text-sm font-medium">
                  {t('profile.contact')}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    control={form.control}
                    name="streetName"
                    label={t('profile.streetName')}
                    autoComplete="address-line1"
                  />
                  <TextField
                    control={form.control}
                    name="houseNumber"
                    label={t('profile.houseNumber')}
                    autoComplete="address-line2"
                  />
                  <TextField
                    control={form.control}
                    name="postcode"
                    label={t('profile.postcode')}
                    autoComplete="postal-code"
                  />
                  <TextField
                    control={form.control}
                    name="city"
                    label={t('profile.city')}
                    autoComplete="address-level2"
                  />
                </div>
                <TextField
                  control={form.control}
                  name="phoneNumber"
                  label={t('profile.phoneNumber')}
                  type="tel"
                  autoComplete="tel"
                />
              </fieldset>

              <fieldset className="space-y-4 border-t pt-5">
                <legend className="text-sm font-medium">
                  {t('profile.details')}
                </legend>
                <TextField
                  control={form.control}
                  name="bankAccountNumber"
                  label={t('profile.bankAccountNumber')}
                  autoComplete="off"
                />
                <TextField
                  control={form.control}
                  name="backNumber"
                  label={t('profile.backNumber')}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={32767}
                />
              </fieldset>

              {status.kind === 'error' ? (
                <p className="text-sm text-destructive" role="alert">
                  {status.message}
                </p>
              ) : null}

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
                    status.kind === 'submitting' ||
                    imageBusy ||
                    !targetUserId ||
                    information.isLoading
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

function TextField({
  control,
  name,
  label,
  ...inputProps
}: {
  control: ReturnType<typeof useForm<ProfileFormValues>>['control'];
  name: keyof ProfileFormValues;
  label: string;
} & Omit<React.ComponentProps<typeof Input>, 'name'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...inputProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function toFormValues(
  email: string | null | undefined,
  information:
    | {
        streetName: string | null;
        houseNumber: string | null;
        postcode: string | null;
        city: string | null;
        phoneNumber: string | null;
        bankAccountNumber?: string | null;
        backNumber: number | null;
      }
    | null
    | undefined,
): ProfileFormValues {
  return {
    email: email ?? '',
    streetName: information?.streetName ?? '',
    houseNumber: information?.houseNumber ?? '',
    postcode: information?.postcode ?? '',
    city: information?.city ?? '',
    phoneNumber: information?.phoneNumber ?? '',
    bankAccountNumber: information?.bankAccountNumber ?? '',
    backNumber:
      information?.backNumber === null ||
      information?.backNumber === undefined
        ? ''
        : String(information.backNumber),
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function rpcBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3002'
  ).replace(/\/+$/, '');
}
