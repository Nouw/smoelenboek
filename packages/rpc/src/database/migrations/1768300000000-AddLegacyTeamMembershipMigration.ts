import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegacyTeamMembershipMigration1768300000000
  implements MigrationInterface
{
  name = 'AddLegacyTeamMembershipMigration1768300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "legacy_team_migration_map" (
        "legacyTeamId" bigint NOT NULL,
        "teamId" uuid NOT NULL,
        "source" character varying NOT NULL DEFAULT 'smoelenboek-v5-mysql',
        "migratedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legacy_team_migration_map" PRIMARY KEY ("legacyTeamId"),
        CONSTRAINT "UQ_legacy_team_migration_map_teamId" UNIQUE ("teamId"),
        CONSTRAINT "FK_legacy_team_migration_map_team" FOREIGN KEY ("teamId")
          REFERENCES "teams"("id") ON DELETE RESTRICT
          DEFERRABLE INITIALLY DEFERRED
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "legacy_team_membership_migration_map" (
        "legacyMembershipId" bigint NOT NULL,
        "membershipId" uuid NOT NULL,
        "source" character varying NOT NULL DEFAULT 'smoelenboek-v5-mysql',
        "migratedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legacy_team_membership_migration_map"
          PRIMARY KEY ("legacyMembershipId"),
        CONSTRAINT "UQ_legacy_team_membership_migration_map_membershipId"
          UNIQUE ("membershipId"),
        CONSTRAINT "FK_legacy_team_membership_migration_map_membership"
          FOREIGN KEY ("membershipId") REFERENCES "team_memberships"("id")
          ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE "legacy_team_membership_migration_map"',
    );
    await queryRunner.query('DROP TABLE "legacy_team_migration_map"');
  }
}
