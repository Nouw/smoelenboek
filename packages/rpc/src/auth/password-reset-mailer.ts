export type PasswordResetMessage = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  url: string;
  token: string;
};

export interface PasswordResetMailer {
  send(message: PasswordResetMessage): Promise<void>;
}

export function createConsolePasswordResetMailer(
  logger: Pick<Console, 'info'> = console,
): PasswordResetMailer {
  return {
    async send({ user, url }) {
      logger.info(
        `[password-reset] To: ${user.email}\n                  URL: ${url}`,
      );
    },
  };
}

export function createOutboxPasswordResetMailer(database: Pick<Pool, 'query'>): PasswordResetMailer {
  return {
    async send({ user, url }) {
      await queueAuthEmail(database, 'password_reset', user, url);
    },
  };
}

export async function queueAuthEmail(
  database: Pick<Pool, 'query'>,
  messageType: 'password_reset' | 'email_verification',
  user: PasswordResetMessage['user'],
  url: string,
): Promise<void> {
  const localeResult = await database.query<{ preferredLocale: 'nl' | 'en' }>(
    `SELECT "preferredLocale" FROM "users" WHERE "id" = $1`, [user.id],
  );
  const locale = localeResult.rows[0]?.preferredLocale ?? 'nl';
  await database.query(
    `INSERT INTO "email_outbox" ("messageType", "recipient", "locale", "payload", "relatedUserId", "deduplicationKey") VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
    [messageType, user.email.toLowerCase(), locale, JSON.stringify({ name: user.name, url }), user.id, `${messageType}:${user.id}:${randomUUID()}`],
  );
}
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
