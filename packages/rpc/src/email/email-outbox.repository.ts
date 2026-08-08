import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { EmailOutboxEntity, type EmailLocale, type EmailMessageType } from './entities/email-outbox.entity';

export type QueueEmailInput =
  | { messageType: 'invitation'; recipient: string; locale: EmailLocale; name: string; url: string; expiresAt: string; relatedUserId?: string | null; deduplicationKey: string }
  | { messageType: 'password_reset'; recipient: string; locale: EmailLocale; name: string; url: string; relatedUserId?: string | null; deduplicationKey: string }
  | { messageType: 'email_verification'; recipient: string; locale: EmailLocale; name: string; url: string; relatedUserId?: string | null; deduplicationKey: string }
  | { messageType: 'address_update'; recipient: string; locale: EmailLocale; name: string; newAddress: string; relatedUserId?: string | null; deduplicationKey: string };

@Injectable()
export class EmailOutboxRepository {
  constructor(private readonly dataSource: DataSource) {}

  async enqueue(input: QueueEmailInput, manager?: EntityManager): Promise<EmailOutboxEntity> {
    const { messageType, recipient, locale, relatedUserId, deduplicationKey } = input;
    const payload = extractPayload(input);
    const repository = (manager ?? this.dataSource.manager).getRepository(EmailOutboxEntity);
    return repository.save(repository.create({ messageType, recipient, locale, payload, relatedUserId: relatedUserId ?? null, deduplicationKey }));
  }

  claim(limit = 20): Promise<EmailOutboxEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const result: unknown = await manager.query(
        `UPDATE "email_outbox" SET "status" = 'sending', "updatedAt" = now()
         WHERE "id" IN (SELECT "id" FROM "email_outbox" WHERE ("status" = 'pending' AND "nextAttemptAt" <= now()) OR ("status" = 'sending' AND "updatedAt" < now() - interval '5 minutes') ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT $1)
         RETURNING *`,
        [limit],
      );
      const rows = unwrapAffectedRows(result);
      if (!rows.every(isClaimedEmail)) {
        throw new Error('Email outbox claim returned a row without an id.');
      }
      return rows;
    });
  }

  async markSent(id: string): Promise<void> {
    await this.dataSource.getRepository(EmailOutboxEntity).update(id, { status: 'sent', sentAt: new Date(), lastError: null });
  }

  async markDeliveryFailure(message: EmailOutboxEntity, error: string): Promise<void> {
    const attempts = message.attempts + 1;
    const final = attempts >= 8;
    const delayMs = Math.min(60 * 60_000, 2 ** attempts * 60_000);
    await this.dataSource.getRepository(EmailOutboxEntity).update(message.id, {
      status: final ? 'failed' : 'pending', attempts, lastError: error.slice(0, 2000), nextAttemptAt: new Date(Date.now() + delayMs),
    });
  }

  async refreshExpiringInvitation(message: EmailOutboxEntity): Promise<EmailOutboxEntity> {
    if (message.messageType !== 'invitation' || !message.relatedUserId) return message;
    const expiry = new Date(String(message.payload.expiresAt ?? 0));
    if (expiry.getTime() > Date.now() + 60 * 60_000) return message;
    return this.dataSource.transaction(async (manager) => {
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60_000);
      await manager.query(`DELETE FROM "verification" WHERE "value" = $1 AND "identifier" LIKE 'reset-password:%'`, [message.relatedUserId]);
      await manager.query(`INSERT INTO "verification" ("identifier", "value", "expiresAt") VALUES ($1, $2, $3)`, [`reset-password:${token}`, message.relatedUserId, expiresAt]);
      const oldUrl = String(message.payload.url);
      const url = oldUrl.replace(/\/reset-password\/[^?]+/, `/reset-password/${token}`);
      message.payload = { ...message.payload, url, expiresAt: expiresAt.toISOString() };
      await manager.query(`UPDATE "email_outbox" SET "payload" = $2::jsonb, "updatedAt" = now() WHERE "id" = $1`, [message.id, JSON.stringify(message.payload)]);
      return message;
    });
  }
}

function extractPayload(input: QueueEmailInput): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { messageType: _mt, recipient: _r, locale: _l, relatedUserId: _ru, deduplicationKey: _dk, ...payload } = input as Record<string, unknown>;
  return payload;
}

function unwrapAffectedRows(result: unknown): unknown[] {
  if (!Array.isArray(result)) return [];
  // TypeORM's PostgreSQL driver wraps UPDATE ... RETURNING as [rows, affectedCount].
  if (result.length === 2 && Array.isArray(result[0]) && typeof result[1] === 'number') return result[0];
  return result;
}

function isClaimedEmail(value: unknown): value is EmailOutboxEntity {
  return typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string';
}
