import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeamImageUrl1767600000000 implements MigrationInterface {
  name = 'AddTeamImageUrl1767600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "teams" ADD "imageUrl" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "teams" DROP COLUMN "imageUrl"');
  }
}
