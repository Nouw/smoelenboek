'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
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
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Clerk is not configured.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <AuthenticatedUserPanel />;
}

function AuthenticatedUserPanel() {
  const user = trpc.user.me.useQuery(undefined, {
    retry: false,
  });
  const syncUser = trpc.user.syncFromClerk.useMutation({
    onSuccess: () => user.refetch(),
  });
  const initials = [user.data?.firstName, user.data?.lastName]
    .filter(Boolean)
    .map((part) => part?.slice(0, 1).toUpperCase())
    .join('');

  return (
    <Card className="w-full max-w-xl">
      <SignedOut>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your account to sync and inspect your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton mode="modal">
            <Button type="button">Sign in</Button>
          </SignInButton>
        </CardContent>
      </SignedOut>
      <SignedIn>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={user.data?.imageUrl ?? undefined} />
                <AvatarFallback>{initials || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Current Clerk user projection in the app database.
                </CardDescription>
              </div>
            </div>
            <UserButton />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => syncUser.mutate()}
              disabled={syncUser.isPending}
            >
              {syncUser.isPending ? 'Syncing...' : 'Sync profile'}
            </Button>
            {user.isFetching ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="text-muted-foreground text-sm">
                {user.data ? 'Profile synced' : 'No synced profile yet'}
              </span>
            )}
          </div>
          <Separator />
          <pre className="bg-muted text-muted-foreground max-h-72 overflow-auto rounded-md p-4 text-left text-xs">
            {user.data
              ? JSON.stringify(user.data, null, 2)
              : 'No synced user profile yet.'}
          </pre>
        </CardContent>
      </SignedIn>
    </Card>
  );
}
