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
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '@/app/trpc';
import { useI18n } from '@/lib/i18n';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';

type EditableUserInformation = {
  streetName: string | null;
  houseNumber: string | null;
  postcode: string | null;
  city: string | null;
  phoneNumber: string | null;
  bankAccountNumber?: string | null;
  backNumber: number | null;
};

type UserInformationEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  information: EditableUserInformation | null | undefined;
  canEditBankAccount: boolean;
  onSaved: () => void | Promise<void>;
};

const optionalText = (maximumLength: number) =>
  z.string().trim().max(maximumLength);

const baseInformationFormSchema = z.object({
  streetName: optionalText(128),
  houseNumber: optionalText(32),
  postcode: optionalText(16),
  city: optionalText(128),
  phoneNumber: optionalText(32),
  bankAccountNumber: optionalText(64),
  backNumber: z.string().trim(),
});

type InformationFormValues = z.infer<typeof baseInformationFormSchema>;

export function UserInformationEditDialog({
  open,
  onOpenChange,
  userId,
  information,
  canEditBankAccount,
  onSaved,
}: UserInformationEditDialogProps) {
  const { t } = useI18n();
  const formSchema = useMemo(
    () =>
      baseInformationFormSchema.refine(
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
  const form = useForm<InformationFormValues>({
    resolver: zodResolver(formSchema),
    values: toFormValues(information),
  });
  const updateInformation = trpc.user.updateInformation.useMutation();

  async function onSubmit(values: InformationFormValues) {
    try {
      await updateInformation.mutateAsync({
        userId,
        changes: {
          streetName: emptyToNull(values.streetName),
          houseNumber: emptyToNull(values.houseNumber),
          postcode: emptyToNull(values.postcode),
          city: emptyToNull(values.city),
          phoneNumber: emptyToNull(values.phoneNumber),
          ...(canEditBankAccount
            ? {
                bankAccountNumber: emptyToNull(values.bankAccountNumber),
              }
            : {}),
          backNumber:
            values.backNumber === '' ? null : Number(values.backNumber),
        },
      });
      await onSaved();
      onOpenChange(false);
    } catch {
      // The mutation exposes its error below and keeps the form open for retry.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('profile.editInformation')}</DialogTitle>
          <DialogDescription>
            {t('profile.updateInformationDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <fieldset className="space-y-4">
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
              {canEditBankAccount ? (
                <TextField
                  control={form.control}
                  name="bankAccountNumber"
                  label={t('profile.bankAccountNumber')}
                  autoComplete="off"
                />
              ) : null}
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

            {updateInformation.error ? (
              <p className="text-sm text-destructive" role="alert">
                {updateInformation.error.message ||
                  t('profile.updateInformationFailed')}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateInformation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={updateInformation.isPending}>
                {updateInformation.isPending
                  ? t('profile.saving')
                  : t('profile.saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
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
  control: ReturnType<typeof useForm<InformationFormValues>>['control'];
  name: keyof InformationFormValues;
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
  information: EditableUserInformation | null | undefined,
): InformationFormValues {
  return {
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
