import type { ClerkClaims } from '../../auth/auth-context';

export class SyncUserFromClerkCommand {
  constructor(
    public readonly clerkUserId: string,
    public readonly claims: ClerkClaims,
  ) {}
}
