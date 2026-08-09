import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSponsorhengel1769400000000 implements MigrationInterface {
  name = 'CreateSponsorhengel1769400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sponsorhengel" (
        "id"           varchar(16) NOT NULL DEFAULT 'singleton',
        "objectName"   character varying NOT NULL,
        "originalName" character varying(255) NOT NULL,
        "mimeType"     character varying(64) NOT NULL DEFAULT 'application/pdf',
        "byteSize"     bigint NOT NULL,
        "updatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sponsorhengel" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_sponsorhengel_singleton" CHECK ("id" = 'singleton')
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sponsorhengel"`);
  }
}
