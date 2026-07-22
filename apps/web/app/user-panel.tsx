'use client';

import { authClient } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Separator } from '@repo/ui/components/separator';
import { Skeleton } from '@repo/ui/components/skeleton';

import { trpc } from './trpc';

export function UserPanel() {
  return <AuthenticatedUserPanel />;
}

function AuthenticatedUserPanel() {
  const { t } = useI18n();
  const session = authClient.useSession();
  const user = trpc.user.me.useQuery(undefined, {
    retry: false,
    enabled: Boolean(session.data),
  });
  const syncUser = trpc.user.syncFromAuth.useMutation({
    onSuccess: () => user.refetch(),
  });
  const initials = [user.data?.firstName, user.data?.lastName]
    .filter(Boolean)
    .map((part) => part?.slice(0, 1).toUpperCase())
    .join('');

  return (
    <Card className="w-full max-w-xl">
      {!session.data ? (
        <CardHeader>
          <CardTitle>{t('userPanel.signIn')}</CardTitle>
          <CardDescription>
            {t('userPanel.signInDescription')}
          </CardDescription>
        </CardHeader>
      ) : (
        <>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={user.data?.imageUrl ?? undefined} />
                <AvatarFallback>{initials || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{t('userPanel.profile')}</CardTitle>
                <CardDescription>
                  {t('userPanel.currentUserDescription')}
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => window.location.reload(),
                  },
                });
              }}
            >
              {t('nav.logout')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => syncUser.mutate()}
              disabled={syncUser.isPending}
            >
              {syncUser.isPending ? t('userPanel.syncing') : t('userPanel.sync')}
            </Button>
            {user.isFetching ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="text-muted-foreground text-sm">
                {user.data
                  ? t('userPanel.synced')
                  : t('userPanel.noSyncedProfile')}
              </span>
            )}
          </div>
          <Separator />
          <pre className="bg-muted text-muted-foreground max-h-72 overflow-auto rounded-md p-4 text-left text-xs">
            {user.data
              ? JSON.stringify(user.data, null, 2)
              : t('userPanel.noSyncedProfile')}
          </pre>
        </CardContent>
        </>
      )}
    </Card>
  );
}
