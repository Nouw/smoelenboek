import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLegacyPasswordResetDeliveryState1769800000000
  implements MigrationInterface
{
  name = 'DropLegacyPasswordResetDeliveryState1769800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "passwordMigrationResetSentAt"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "passwordMigrationResetSentAt" TIMESTAMP WITH TIME ZONE
    `);
  }
}
