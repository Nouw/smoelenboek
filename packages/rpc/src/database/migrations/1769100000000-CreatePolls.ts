import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePolls1769100000000 implements MigrationInterface {
  name = 'CreatePolls1769100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "polls" (
        "id" uuid NOT NULL,
        "question" character varying(500) NOT NULL,
        "choiceMode" character varying NOT NULL,
        "opensAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "closesAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "publishedAt" TIMESTAMP WITH TIME ZONE,
        "archivedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_polls_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_polls_choice_mode" CHECK ("choiceMode" IN ('single_choice', 'multiple_choice')),
        CONSTRAINT "CHK_polls_dates" CHECK ("opensAt" < "closesAt")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_polls_visibility" ON "polls" ("publishedAt", "archivedAt", "opensAt", "closesAt")',
    );
    await queryRunner.query(`
      CREATE TABLE "poll_options" (
        "id" uuid NOT NULL,
        "pollId" uuid NOT NULL,
        "label" character varying(200) NOT NULL,
        "position" smallint NOT NULL,
        CONSTRAINT "PK_poll_options_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_poll_options_position" UNIQUE ("pollId", "position"),
        CONSTRAINT "CHK_poll_options_position" CHECK ("position" >= 0),
        CONSTRAINT "FK_poll_options_poll" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "poll_responses" (
        "id" uuid NOT NULL,
        "pollId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_poll_responses_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_poll_responses_user" UNIQUE ("pollId", "userId"),
        CONSTRAINT "FK_poll_responses_poll" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_poll_responses_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "poll_selections" (
        "id" uuid NOT NULL,
        "responseId" uuid NOT NULL,
        "optionId" uuid NOT NULL,
        CONSTRAINT "PK_poll_selections_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_poll_selections_option" UNIQUE ("responseId", "optionId"),
        CONSTRAINT "FK_poll_selections_response" FOREIGN KEY ("responseId") REFERENCES "poll_responses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_poll_selections_option" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_poll_selections_option" ON "poll_selections" ("optionId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_poll_selections_option"');
    await queryRunner.query('DROP TABLE "poll_selections"');
    await queryRunner.query('DROP TABLE "poll_responses"');
    await queryRunner.query('DROP TABLE "poll_options"');
    await queryRunner.query('DROP INDEX "IDX_polls_visibility"');
    await queryRunner.query('DROP TABLE "polls"');
  }
}
