'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

import { trpc } from './trpc';

export function UserPanel() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <section>Clerk is not configured.</section>;
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

  return (
    <section>
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button">Sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
        <button
          type="button"
          onClick={() => syncUser.mutate()}
          disabled={syncUser.isPending}
        >
          Sync profile
        </button>
        <pre>
          {user.data
            ? JSON.stringify(user.data, null, 2)
            : 'No synced user profile yet.'}
        </pre>
      </SignedIn>
    </section>
  );
}
