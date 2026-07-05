import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBetterAuthAdminFields1767800000000
  implements MigrationInterface
{
  name = 'AddBetterAuthAdminFields1767800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS "banned" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "banReason" character varying,
        ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "session"
        ADD COLUMN IF NOT EXISTS "impersonatedBy" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session"
        DROP COLUMN IF EXISTS "impersonatedBy"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "banExpires",
        DROP COLUMN IF EXISTS "banReason",
        DROP COLUMN IF EXISTS "banned",
        DROP COLUMN IF EXISTS "role"
    `);
  }
}
