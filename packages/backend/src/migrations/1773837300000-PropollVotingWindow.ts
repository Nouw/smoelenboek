import { MigrationInterface, QueryRunner } from 'typeorm';

export class PropollVotingWindow1773837300000 implements MigrationInterface {
  name = 'PropollVotingWindow1773837300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `propoll` ADD `voteStartAt` datetime NULL',
    );
    await queryRunner.query('ALTER TABLE `propoll` ADD `voteEndAt` datetime NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `propoll` DROP COLUMN `voteEndAt`');
    await queryRunner.query('ALTER TABLE `propoll` DROP COLUMN `voteStartAt`');
  }
}
