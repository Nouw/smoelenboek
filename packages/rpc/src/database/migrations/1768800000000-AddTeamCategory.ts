import { MigrationInterface, QueryRunner } from 'typeorm';

const TEAM_SNAPSHOT_EVENTS = [
  'team.created',
  'team.updated',
  'team.archived',
] as const;

export class AddTeamCategory1768800000000 implements MigrationInterface {
  name = 'AddTeamCategory1768800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "teams" ADD "category" character varying',
    );
    await queryRunner.query(`
      UPDATE "teams"
      SET "category" = CASE
        WHEN "name" ILIKE 'Heren %' THEN 'men'
        WHEN "name" ILIKE 'Dames %' THEN 'women'
        ELSE NULL
      END
    `);
    await queryRunner.query(`
      DO $$
      DECLARE
        unclassified_count integer;
      BEGIN
        SELECT COUNT(*) INTO unclassified_count
        FROM "teams"
        WHERE "category" IS NULL;

        IF unclassified_count > 0 THEN
          RAISE EXCEPTION
            'Cannot classify % team(s). Rename them to start with Heren or Dames before running this migration.',
            unclassified_count;
        END IF;
      END
      $$
    `);
    await queryRunner.query(
      `
        UPDATE "stored_events" event
        SET
          "payload" = event."payload" || jsonb_build_object(
            'category', team."category"
          ),
          "eventVersion" = 2
        FROM "teams" team
        WHERE event."aggregateType" = 'team'
          AND event."aggregateId" = team."id"::text
          AND event."eventType" = ANY($1)
      `,
      [TEAM_SNAPSHOT_EVENTS],
    );
    await queryRunner.query(`
      ALTER TABLE "teams"
      ALTER COLUMN "category" SET NOT NULL,
      ADD CONSTRAINT "CHK_teams_category"
        CHECK ("category" IN ('men', 'women'))
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_teams_category_archived" ON "teams" ("category", "archivedAt")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_teams_category_archived"');
    await queryRunner.query(
      'ALTER TABLE "teams" DROP CONSTRAINT "CHK_teams_category"',
    );
    await queryRunner.query('ALTER TABLE "teams" DROP COLUMN "category"');
    await queryRunner.query(
      `
        UPDATE "stored_events"
        SET
          "payload" = "payload" - 'category',
          "eventVersion" = 1
        WHERE "aggregateType" = 'team'
          AND "eventType" = ANY($1)
      `,
      [TEAM_SNAPSHOT_EVENTS],
    );
  }
}
