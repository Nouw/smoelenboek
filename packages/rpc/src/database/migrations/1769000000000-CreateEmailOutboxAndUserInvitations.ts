import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailOutboxAndUserInvitations1769000000000
  implements MigrationInterface
{
  name = 'CreateEmailOutboxAndUserInvitations1769000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "preferredLocale" character varying(2) NOT NULL DEFAULT 'nl',
        ADD COLUMN "invitedAt" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "accountActivatedAt" TIMESTAMP WITH TIME ZONE,
        ADD CONSTRAINT "CHK_users_preferredLocale" CHECK ("preferredLocale" IN ('nl', 'en'))
    `);
    await queryRunner.query(`
      UPDATE "users" SET "accountActivatedAt" = "createdAt"
      WHERE "accountActivatedAt" IS NULL
    `);
    await queryRunner.query(`
      CREATE TABLE "email_outbox" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "messageType" character varying(64) NOT NULL,
        "recipient" character varying(320) NOT NULL,
        "locale" character varying(2) NOT NULL DEFAULT 'nl',
        "payload" jsonb NOT NULL,
        "relatedUserId" uuid,
        "deduplicationKey" character varying(255) NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "nextAttemptAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "lastError" text,
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_outbox_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_outbox_deduplicationKey" UNIQUE ("deduplicationKey"),
        CONSTRAINT "CHK_email_outbox_locale" CHECK ("locale" IN ('nl', 'en')),
        CONSTRAINT "CHK_email_outbox_status" CHECK ("status" IN ('pending', 'sending', 'sent', 'failed')),
        CONSTRAINT "CHK_email_outbox_attempts" CHECK ("attempts" >= 0),
        CONSTRAINT "FK_email_outbox_user" FOREIGN KEY ("relatedUserId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_email_outbox_pending" ON "email_outbox" ("status", "nextAttemptAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_email_outbox_user" ON "email_outbox" ("relatedUserId", "createdAt")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "email_outbox"');
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "CHK_users_preferredLocale", DROP COLUMN "accountActivatedAt", DROP COLUMN "invitedAt", DROP COLUMN "preferredLocale"`);
  }
}
