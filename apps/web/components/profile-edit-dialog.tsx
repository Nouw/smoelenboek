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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { authClient } from '@/lib/auth-client';
import { trpc } from '@/app/trpc';

const profileFormSchema = z.object({
  email: z.string().email(),
  imageUrl: z.string().url().nullable(),
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
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'error'; message: string }
    | { kind: 'success'; emailChanged: boolean; imageUrlChanged: boolean }
  >({ kind: 'idle' });

  const user = trpc.user.me.useQuery(undefined, {
    enabled: open,
    retry: false,
  });
  const updateProfile = trpc.user.updateProfile.useMutation();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
      email: user.data?.email ?? '',
      imageUrl: user.data?.imageUrl ?? '',
    },
  });

  const watchedImageUrl = form.watch('imageUrl');

  async function onSubmit(values: ProfileFormValues) {
    setStatus({ kind: 'submitting' });

    const currentEmail = user.data?.email ?? '';
    const currentImageUrl = user.data?.imageUrl ?? null;
    const emailChanged = values.email !== currentEmail;
    const imageUrlChanged = values.imageUrl !== currentImageUrl;

    if (!emailChanged && !imageUrlChanged) {
      setStatus({ kind: 'idle' });
      onOpenChange(false);
      return;
    }

    try {
      if (imageUrlChanged) {
        await updateProfile.mutateAsync({ imageUrl: values.imageUrl });
        await authClient.updateUser({
          image: values.imageUrl,
        });
      }

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
        imageUrlChanged,
      });

      setTimeout(() => {
        onOpenChange(false);
        setStatus({ kind: 'idle' });
      }, 3000);
    } catch (error) {
      setStatus({
        kind: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to update profile.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your profile picture or email address.
          </DialogDescription>
        </DialogHeader>

        {status.kind === 'success' ? (
          <div className="space-y-2 py-4">
            {status.imageUrlChanged && (
              <p className="text-sm">Profile picture updated.</p>
            )}
            {status.emailChanged && (
              <p className="text-sm">
                Verification email sent. Click the link to confirm your new
                address.
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Changing your email sends a verification link to the new
                      address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile picture URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/avatar.png"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedImageUrl ? (
                <div className="flex items-center gap-3 rounded-md border p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={watchedImageUrl}
                    alt="Preview"
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-muted-foreground text-sm">
                    Preview
                  </span>
                </div>
              ) : null}

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
                  Cancel
                </Button>
                <Button type="submit" disabled={status.kind === 'submitting'}>
                  {status.kind === 'submitting' ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
