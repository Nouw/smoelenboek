import type { AuthClaims } from '../../auth/auth-context';

export class SyncUserFromAuthCommand {
  constructor(
    public readonly userId: string,
    public readonly claims: AuthClaims,
  ) {}
}
