import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSeasons1767000000000 implements MigrationInterface {
  name = 'CreateSeasons1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "seasons" (
        "id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_seasons_name" UNIQUE ("name"),
        CONSTRAINT "CHK_seasons_valid_range" CHECK ("startsAt" < "endsAt"),
        CONSTRAINT "PK_seasons_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_seasons_range_lookup" ON "seasons" ("startsAt", "endsAt")',
    );
    await queryRunner.query(`
      ALTER TABLE "seasons"
      ADD CONSTRAINT "EX_seasons_no_overlap"
      EXCLUDE USING gist (tstzrange("startsAt", "endsAt", '[]') WITH &&)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "seasons" DROP CONSTRAINT "EX_seasons_no_overlap"',
    );
    await queryRunner.query('DROP INDEX "IDX_seasons_range_lookup"');
    await queryRunner.query('DROP TABLE "seasons"');
  }
}

