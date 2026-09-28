import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancelledEmailOutboxStatus1769900000000 implements MigrationInterface {
  name = 'AddCancelledEmailOutboxStatus1769900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "email_outbox" DROP CONSTRAINT "CHK_email_outbox_status"');
    await queryRunner.query(`ALTER TABLE "email_outbox" ADD CONSTRAINT "CHK_email_outbox_status"
      CHECK ("status" IN ('pending', 'sending', 'sent', 'failed', 'cancelled'))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "email_outbox" SET "status" = 'failed', "updatedAt" = now()
      WHERE "status" = 'cancelled'`);
    await queryRunner.query('ALTER TABLE "email_outbox" DROP CONSTRAINT "CHK_email_outbox_status"');
    await queryRunner.query(`ALTER TABLE "email_outbox" ADD CONSTRAINT "CHK_email_outbox_status"
      CHECK ("status" IN ('pending', 'sending', 'sent', 'failed'))`);
  }
}
