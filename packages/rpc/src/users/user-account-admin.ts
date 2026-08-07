import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { createAdminBetterAuth, type BetterAuthInstance } from '../auth/better-auth-instance';
import { Pool } from 'pg';

export const USER_ACCOUNT_ADMIN = Symbol('USER_ACCOUNT_ADMIN');
export type CreatedAccount = { id: string; email: string; name: string };
export interface UserAccountAdmin {
  create(input: { email: string; name: string; password: string }): Promise<CreatedAccount>;
  remove(userId: string): Promise<void>;
}

@Injectable()
export class BetterAuthUserAccountAdmin implements UserAccountAdmin, OnModuleDestroy {
  private auth: Promise<BetterAuthInstance> | null = null;
  private readonly database = new Pool({ connectionString: process.env.DATABASE_URL });
  private getAuth(): Promise<BetterAuthInstance> { return (this.auth ??= createAdminBetterAuth()); }
  async create(input: { email: string; name: string; password: string }): Promise<CreatedAccount> {
    const result = await (await this.getAuth()).api.createUser({ body: { ...input, role: 'user' } }) as { user?: CreatedAccount };
    if (!result.user) throw new Error('Better Auth did not return a created user.');
    return result.user;
  }
  async remove(userId: string): Promise<void> {
    await this.database.query(`DELETE FROM "users" WHERE "id" = $1`, [userId]);
  }
  async onModuleDestroy(): Promise<void> { await this.database.end(); }
}

export const InjectUserAccountAdmin = () => Inject(USER_ACCOUNT_ADMIN);
