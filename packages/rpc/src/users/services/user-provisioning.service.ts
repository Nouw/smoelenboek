import type { CreateManagedUserInput, ManagedUserDto } from '@repo/api';
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';

import { EmailOutboxRepository } from '../../email/email-outbox.repository';
import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { UserInformationEntity } from '../entities/user-information.entity';
import { UserEntity } from '../entities/user.entity';
import { UserProvisionedEvent } from '../events/user-provisioned.event';
import { InjectUserAccountAdmin, type UserAccountAdmin } from '../user-account-admin';

@Injectable()
export class UserProvisioningService {
  private readonly logger = new Logger(UserProvisioningService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly outbox: EmailOutboxRepository,
    @InjectUserAccountAdmin() private readonly accounts: UserAccountAdmin,
  ) {}

  async create(input: CreateManagedUserInput, actorUserId: string): Promise<ManagedUserDto> {
    const name = [input.firstName, input.lastName].join(' ').trim();
    const account = await this.accounts.create({ email: input.email, name, password: randomBytes(32).toString('base64url') });
    try {
      return await this.dataSource.transaction(async (manager) => {
        const now = new Date();
        await manager.getRepository(UserEntity).update(account.id, {
          authUserId: account.id, firstName: input.firstName ?? null, lastName: input.lastName ?? null,
          preferredLocale: input.preferredLocale, invitedAt: now, accountActivatedAt: null,
        });
        const information = informationValues(account.id, input);
        if (Object.values(information).some((value, index) => index > 0 && value != null)) {
          await manager.getRepository(UserInformationEntity).save(manager.getRepository(UserInformationEntity).create(information));
        }
        const provisionedEvent = UserProvisionedEvent.create(
          { userId: account.id, email: input.email, name, preferredLocale: input.preferredLocale },
          actorUserId,
        );
        await this.eventStoreRepository.append(provisionedEvent, manager);
        await this.queueInvitation(account.id, input.email, name, input.preferredLocale, now, manager);
        return { id: account.id, email: input.email, name, preferredLocale: input.preferredLocale, role: 'user', invitedAt: now.toISOString(), accountActivatedAt: null, leaveDate: null, invitationStatus: 'pending' };
      });
    } catch (error) {
      try { await this.accounts.remove(account.id); } catch (compensationError) {
        this.logger.error(JSON.stringify({ event: 'users.provisioning_compensation_failed', userId: account.id, error: errorMessage(compensationError) }));
      }
      throw error;
    }
  }

  async resend(userId: string): Promise<{ queued: true }> {
    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(
        `SELECT u."id", u."email", u."name", u."preferredLocale", u."banned", ui."leaveDate"
         FROM "users" u LEFT JOIN "user_information" ui ON ui."userId" = u."id"
         WHERE u."id" = $1 FOR UPDATE OF u`,
        [userId],
      ) as Array<{ id: string; email: string | null; name: string; preferredLocale: 'nl' | 'en'; banned: boolean; leaveDate: string | null }>;
      const user = rows[0];
      if (!user?.email) throw new NotFoundException('User not found or has no email address.');
      if (user.banned || user.leaveDate !== null) throw new ConflictException('Inactive users cannot be invited.');
      await this.queueReactivationInvitation({ ...user, email: user.email }, manager);
    });
    return { queued: true };
  }

  async queueReactivationInvitation(
    user: { id: string; email: string; name: string; preferredLocale: 'nl' | 'en' },
    manager: import('typeorm').EntityManager,
  ): Promise<Date> {
    const now = new Date();
    await manager.query(`DELETE FROM "verification" WHERE "value" = $1 AND "identifier" LIKE 'reset-password:%'`, [user.id]);
    await manager.getRepository(UserEntity).update(user.id, { invitedAt: now });
    await this.queueInvitation(user.id, user.email, user.name, user.preferredLocale, now, manager);
    return now;
  }

  private async queueInvitation(userId: string, email: string, name: string, locale: 'nl' | 'en', now: Date, manager: import('typeorm').EntityManager): Promise<void> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    await manager.query(`INSERT INTO "verification" ("identifier", "value", "expiresAt") VALUES ($1, $2, $3)`, [`reset-password:${token}`, userId, expiresAt]);
    const callback = new URL('/reset-password', process.env.WEB_ORIGIN ?? 'http://localhost:3001').toString();
    const url = `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3002/api/auth'}/reset-password/${token}?callbackURL=${encodeURIComponent(callback)}`;
    await this.outbox.enqueue({ messageType: 'invitation', recipient: email, locale, name, url, expiresAt: expiresAt.toISOString(), relatedUserId: userId, deduplicationKey: `invitation:${userId}:${randomUUID()}` }, manager);
  }
}

function informationValues(userId: string, input: CreateManagedUserInput): Partial<UserInformationEntity> & { userId: string } {
  return { userId, streetName: input.streetName ?? null, houseNumber: input.houseNumber ?? null, postcode: input.postcode ?? null, city: input.city ?? null, phoneNumber: input.phoneNumber ?? null, bankAccountNumber: input.bankAccountNumber ?? null, birthDate: input.birthDate ?? null, bondNumber: input.bondNumber ?? null, leaveDate: null, backNumber: input.backNumber ?? null, refereeLicense: input.refereeLicense ?? null };
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
