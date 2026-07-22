'use client';

import { useCallback } from 'react';

import { trpc } from '@/app/trpc';
import { authClient } from '@/lib/auth-client';

export function useCurrentUser() {
  const session = authClient.useSession();
  const query = trpc.user.me.useQuery(undefined, { retry: false });
  const user = query.data;
  const role = user?.role ?? null;
  const currentUserId = user?.id ?? session.data?.user.id;
  const isOwner = useCallback(
    (userId: string) => currentUserId === userId,
    [currentUserId],
  );

  return {
    ...query,
    user,
    role,
    isAdmin: role === 'admin',
    isOwner,
  };
}
