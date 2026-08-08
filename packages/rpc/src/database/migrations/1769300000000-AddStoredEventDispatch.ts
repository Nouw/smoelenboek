import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoredEventDispatch1769300000000 implements MigrationInterface {
  name = 'AddStoredEventDispatch1769300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stored_events"
        ADD COLUMN "dispatchStatus" character varying(16) NOT NULL DEFAULT 'pending',
        ADD COLUMN "dispatchAttempts" integer NOT NULL DEFAULT 0,
        ADD COLUMN "nextDispatchAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        ADD COLUMN "lastDispatchError" text,
        ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        ADD CONSTRAINT "CHK_stored_events_dispatchStatus"
          CHECK ("dispatchStatus" IN ('pending', 'dispatching', 'dispatched', 'failed')),
        ADD CONSTRAINT "CHK_stored_events_dispatchAttempts"
          CHECK ("dispatchAttempts" >= 0)
    `);
    await queryRunner.query(`
      UPDATE "stored_events" SET "dispatchStatus" = 'dispatched', "updatedAt" = now()
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_stored_events_dispatch"
        ON "stored_events" ("nextDispatchAt")
        WHERE "dispatchStatus" IN ('pending', 'dispatching')
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_stored_events_aggregate_sequence"
        ON "stored_events" ("aggregateId", "sequence")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_stored_events_aggregate_sequence"`);
    await queryRunner.query(`DROP INDEX "IDX_stored_events_dispatch"`);
    await queryRunner.query(`
      ALTER TABLE "stored_events"
        DROP CONSTRAINT "CHK_stored_events_dispatchAttempts",
        DROP CONSTRAINT "CHK_stored_events_dispatchStatus",
        DROP COLUMN "updatedAt",
        DROP COLUMN "lastDispatchError",
        DROP COLUMN "nextDispatchAt",
        DROP COLUMN "dispatchAttempts",
        DROP COLUMN "dispatchStatus"
    `);
  }
}
