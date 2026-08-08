import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserInformationJoinDate1769200000000 implements MigrationInterface {
  name = 'DropUserInformationJoinDate1769200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_information" DROP CONSTRAINT "CHK_user_information_membership_dates"`);
    await queryRunner.query(`ALTER TABLE "user_information" DROP COLUMN "joinDate"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_information" ADD COLUMN "joinDate" date`);
    await queryRunner.query(`UPDATE "user_information" information SET "joinDate" = users."createdAt"::date FROM "users" users WHERE users."id" = information."userId"`);
    await queryRunner.query(`ALTER TABLE "user_information" ADD CONSTRAINT "CHK_user_information_membership_dates" CHECK ("joinDate" IS NULL OR "leaveDate" IS NULL OR "leaveDate" >= "joinDate")`);
  }
}
