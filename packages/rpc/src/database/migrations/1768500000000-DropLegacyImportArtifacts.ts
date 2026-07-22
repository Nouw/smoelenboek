import { MigrationInterface, QueryRunner } from 'typeorm';

const legacyImportTables = [
  'legacy_committee_role_import_map',
  'legacy_committee_membership_import_staging',
  'legacy_team_role_import_map',
  'legacy_team_membership_import_staging',
  'legacy_user_import_staging',
  'legacy_committee_membership_migration_map',
  'legacy_committee_migration_map',
  'legacy_team_membership_migration_map',
  'legacy_team_migration_map',
  'legacy_user_migration_map',
] as const;

export class DropLegacyImportArtifacts1768500000000
  implements MigrationInterface
{
  name = 'DropLegacyImportArtifacts1768500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of legacyImportTables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
    }
  }

  public async down(): Promise<void> {
    throw new Error(
      'DropLegacyImportArtifacts1768500000000 is irreversible because the legacy import data has been retired.',
    );
  }
}
