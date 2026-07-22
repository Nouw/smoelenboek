import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegacyUserMigration1768100000000 implements MigrationInterface {
  name = 'AddLegacyUserMigration1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "passwordMigrationRequired" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "passwordMigrationResetSentAt" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      CREATE TABLE "legacy_user_migration_map" (
        "legacyUserId" bigint NOT NULL,
        "userId" uuid NOT NULL,
        "source" character varying NOT NULL DEFAULT 'smoelenboek-v5-mysql',
        "migratedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legacy_user_migration_map" PRIMARY KEY ("legacyUserId"),
        CONSTRAINT "UQ_legacy_user_migration_map_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_legacy_user_migration_map_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE RESTRICT
          DEFERRABLE INITIALLY DEFERRED
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "legacy_user_migration_map"');
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "passwordMigrationResetSentAt",
        DROP COLUMN IF EXISTS "passwordMigrationRequired"
    `);
  }
}
