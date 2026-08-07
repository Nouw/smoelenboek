import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEndedTeamMemberships1768900000000
  implements MigrationInterface
{
  name = 'RemoveEndedTeamMemberships1768900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DELETE FROM "team_memberships" WHERE "endedOn" IS NOT NULL',
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'RemoveEndedTeamMemberships1768900000000 cannot be reverted because removed roster projections are not retained.',
    );
  }
}
