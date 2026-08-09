import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEndedCommitteeMemberships1769600000000
  implements MigrationInterface
{
  name = 'RemoveEndedCommitteeMemberships1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DELETE FROM "committee_memberships" WHERE "endedOn" IS NOT NULL',
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'RemoveEndedCommitteeMemberships1769600000000 cannot be reverted because removed roster projections are not retained.',
    );
  }
}
