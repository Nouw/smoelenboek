import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommitteeImageUrl1769500000000 implements MigrationInterface {
  name = 'AddCommitteeImageUrl1769500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "committees" ADD "imageUrl" character varying',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "committees" DROP COLUMN "imageUrl"');
  }
}
