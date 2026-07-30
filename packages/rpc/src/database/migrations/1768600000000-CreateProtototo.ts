import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProtototo1768600000000 implements MigrationInterface {
  name = 'CreateProtototo1768600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "protototo_rounds" (
        "id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "opensAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "closesAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "tikkieUrl" character varying,
        "publishedAt" TIMESTAMP WITH TIME ZONE,
        "archivedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_protototo_rounds_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_protototo_rounds_dates" CHECK ("opensAt" < "closesAt")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "protototo_rounds"
      ADD CONSTRAINT "EX_protototo_rounds_no_published_overlap"
      EXCLUDE USING gist (
        tstzrange("opensAt", "closesAt", '[)') WITH &&
      )
      WHERE ("publishedAt" IS NOT NULL AND "archivedAt" IS NULL)
    `);
    await queryRunner.query(`
      CREATE TABLE "protototo_matches" (
        "id" uuid NOT NULL,
        "roundId" uuid NOT NULL,
        "nevoboMatchId" uuid NOT NULL,
        "selectedTeamIri" character varying NOT NULL,
        "homeTeamIri" character varying NOT NULL,
        "homeTeamName" character varying NOT NULL,
        "awayTeamIri" character varying NOT NULL,
        "awayTeamName" character varying NOT NULL,
        "subjectSide" character varying NOT NULL,
        "format" character varying NOT NULL,
        "pointMethodIri" character varying NOT NULL,
        "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "resultSetWinners" boolean array,
        "resultStatus" character varying,
        "resultSyncedAt" TIMESTAMP WITH TIME ZONE,
        "lastSyncAttemptAt" TIMESTAMP WITH TIME ZONE,
        "lastSyncError" character varying,
        "removedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_protototo_matches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_protototo_matches_round_nevobo" UNIQUE ("roundId", "nevoboMatchId"),
        CONSTRAINT "CHK_protototo_matches_subject_side" CHECK ("subjectSide" IN ('home', 'away')),
        CONSTRAINT "CHK_protototo_matches_format" CHECK ("format" IN ('best_of_5', 'four_sets', 'four_plus_one')),
        CONSTRAINT "CHK_protototo_matches_result_status" CHECK ("resultStatus" IS NULL OR "resultStatus" IN ('pending', 'final', 'cancelled')),
        CONSTRAINT "FK_protototo_matches_round" FOREIGN KEY ("roundId") REFERENCES "protototo_rounds"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_protototo_matches_round_start" ON "protototo_matches" ("roundId", "startsAt")',
    );
    await queryRunner.query(`
      CREATE TABLE "protototo_entries" (
        "id" uuid NOT NULL,
        "roundId" uuid NOT NULL,
        "userId" uuid,
        "participantType" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "email" character varying,
        "emailNormalized" character varying,
        "firstNameNormalized" character varying,
        "paymentClaimedAt" TIMESTAMP WITH TIME ZONE,
        "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_protototo_entries_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_protototo_entries_participant_type" CHECK ("participantType" IN ('member', 'anonymous')),
        CONSTRAINT "CHK_protototo_entries_identity" CHECK (
          ("participantType" = 'member' AND "userId" IS NOT NULL AND "email" IS NULL AND "emailNormalized" IS NULL AND "firstNameNormalized" IS NULL)
          OR ("participantType" = 'anonymous' AND "userId" IS NULL AND "email" IS NOT NULL AND "emailNormalized" IS NOT NULL AND "firstNameNormalized" IS NOT NULL)
        ),
        CONSTRAINT "FK_protototo_entries_round" FOREIGN KEY ("roundId") REFERENCES "protototo_rounds"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_protototo_entries_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_protototo_entries_member" ON "protototo_entries" ("roundId", "userId") WHERE "userId" IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_protototo_entries_anonymous" ON "protototo_entries" ("roundId", "emailNormalized") WHERE "emailNormalized" IS NOT NULL',
    );
    await queryRunner.query(`
      CREATE TABLE "protototo_predictions" (
        "id" uuid NOT NULL,
        "entryId" uuid NOT NULL,
        "matchId" uuid NOT NULL,
        "setWinners" boolean array NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_protototo_predictions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_protototo_predictions_entry_match" UNIQUE ("entryId", "matchId"),
        CONSTRAINT "FK_protototo_predictions_entry" FOREIGN KEY ("entryId") REFERENCES "protototo_entries"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_protototo_predictions_match" FOREIGN KEY ("matchId") REFERENCES "protototo_matches"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_protototo_predictions_match" ON "protototo_predictions" ("matchId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_protototo_predictions_match"');
    await queryRunner.query('DROP TABLE "protototo_predictions"');
    await queryRunner.query('DROP INDEX "UQ_protototo_entries_anonymous"');
    await queryRunner.query('DROP INDEX "UQ_protototo_entries_member"');
    await queryRunner.query('DROP TABLE "protototo_entries"');
    await queryRunner.query('DROP INDEX "IDX_protototo_matches_round_start"');
    await queryRunner.query('DROP TABLE "protototo_matches"');
    await queryRunner.query('DROP TABLE "protototo_rounds"');
  }
}
