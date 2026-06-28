import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoredEvents1766900000000 implements MigrationInterface {
  name = 'CreateStoredEvents1766900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stored_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sequence" BIGSERIAL NOT NULL,
        "aggregateType" character varying NOT NULL,
        "aggregateId" character varying NOT NULL,
        "eventType" character varying NOT NULL,
        "eventVersion" integer NOT NULL,
        "payload" jsonb NOT NULL,
        "metadata" jsonb NOT NULL,
        "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_stored_events_sequence" UNIQUE ("sequence"),
        CONSTRAINT "PK_stored_events_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_stored_events_aggregate" ON "stored_events" ("aggregateType", "aggregateId", "sequence")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_stored_events_eventType" ON "stored_events" ("eventType")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_stored_events_eventType"');
    await queryRunner.query('DROP INDEX "IDX_stored_events_aggregate"');
    await queryRunner.query('DROP TABLE "stored_events"');
  }
}

