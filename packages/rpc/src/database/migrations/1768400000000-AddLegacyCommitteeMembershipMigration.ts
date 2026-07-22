import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegacyCommitteeMembershipMigration1768400000000
  implements MigrationInterface
{
  name = 'AddLegacyCommitteeMembershipMigration1768400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "legacy_committee_migration_map" (
        "legacyCommitteeId" bigint NOT NULL,
        "committeeId" uuid NOT NULL,
        "source" character varying NOT NULL DEFAULT 'smoelenboek-v5-mysql',
        "migratedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legacy_committee_migration_map"
          PRIMARY KEY ("legacyCommitteeId"),
        CONSTRAINT "UQ_legacy_committee_migration_map_committeeId"
          UNIQUE ("committeeId"),
        CONSTRAINT "FK_legacy_committee_migration_map_committee"
          FOREIGN KEY ("committeeId") REFERENCES "committees"("id")
          ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "legacy_committee_membership_migration_map" (
        "legacyMembershipId" bigint NOT NULL,
        "membershipId" uuid NOT NULL,
        "source" character varying NOT NULL DEFAULT 'smoelenboek-v5-mysql',
        "migratedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_legacy_committee_membership_migration_map"
          PRIMARY KEY ("legacyMembershipId"),
        CONSTRAINT "UQ_legacy_committee_membership_migration_map_membershipId"
          UNIQUE ("membershipId"),
        CONSTRAINT "FK_legacy_committee_membership_migration_map_membership"
          FOREIGN KEY ("membershipId")
          REFERENCES "committee_memberships"("id") ON DELETE RESTRICT
          DEFERRABLE INITIALLY DEFERRED
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE "legacy_committee_membership_migration_map"',
    );
    await queryRunner.query('DROP TABLE "legacy_committee_migration_map"');
  }
}
