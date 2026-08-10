import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegacyPasswordMigrationState1769700000000
  implements MigrationInterface
{
  name = 'AddLegacyPasswordMigrationState1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "passwordMigrationRequired" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "passwordMigrationResetSentAt" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      UPDATE "users" users
      SET "passwordMigrationRequired" = true,
          "updatedAt" = now()
      FROM "account" account
      WHERE account."userId" = users."id"
        AND account."providerId" = 'credential'
        AND (
          account."password" = 'reset'
          OR account."password" ~ '^[$]2[aby][$][0-9]{2}[$]'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "passwordMigrationResetSentAt",
        DROP COLUMN IF EXISTS "passwordMigrationRequired"
    `);
  }
}
