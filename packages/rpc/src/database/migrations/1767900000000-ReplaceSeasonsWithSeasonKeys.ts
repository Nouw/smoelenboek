import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceSeasonsWithSeasonKeys1767900000000
  implements MigrationInterface
{
  name = 'ReplaceSeasonsWithSeasonKeys1767900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['team_memberships', 'committee_memberships']) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD "seasonKey" smallint,
        ADD "startedOn" date,
        ADD "endedOn" date
      `);
      await queryRunner.query(`
        UPDATE "${table}" membership
        SET
          "seasonKey" = EXTRACT(
            YEAR FROM season."startsAt" AT TIME ZONE 'Europe/Amsterdam'
          )::smallint,
          "startedOn" = (season."startsAt" AT TIME ZONE 'Europe/Amsterdam')::date
        FROM "seasons" season
        WHERE membership."seasonId" = season."id"
      `);
    }

    await queryRunner.query(
      'ALTER TABLE "team_memberships" DROP CONSTRAINT "UQ_team_memberships_assignment"',
    );
    await queryRunner.query(
      'ALTER TABLE "committee_memberships" DROP CONSTRAINT "UQ_committee_memberships_assignment"',
    );

    await this.restoreEndedMemberships(
      queryRunner,
      'team_memberships',
      'teamId',
      'team.member_assigned',
      'team.member_removed',
      'teams',
    );
    await this.restoreEndedMemberships(
      queryRunner,
      'committee_memberships',
      'committeeId',
      'committee.member_assigned',
      'committee.member_removed',
      'committees',
    );

    await queryRunner.query(`
      UPDATE "stored_events" event
      SET
        "payload" = (event."payload" - 'seasonId') || jsonb_build_object(
          'seasonKey', EXTRACT(
            YEAR FROM season."startsAt" AT TIME ZONE 'Europe/Amsterdam'
          )::smallint,
          'startedOn', to_char(
            season."startsAt" AT TIME ZONE 'Europe/Amsterdam',
            'YYYY-MM-DD'
          ),
          'endedOn', NULL
        ),
        "eventVersion" = 2
      FROM "seasons" season
      WHERE event."eventType" IN (
        'team.member_assigned',
        'committee.member_assigned'
      )
      AND event."payload"->>'seasonId' = season."id"::text
    `);
    await queryRunner.query(`
      UPDATE "stored_events" event
      SET
        "payload" = jsonb_build_object(
          'membershipId', event."payload"->>'membershipId',
          'removedOn', to_char(
            event."occurredAt" AT TIME ZONE 'Europe/Amsterdam',
            'YYYY-MM-DD'
          )
        ),
        "eventVersion" = 2
      WHERE event."eventType" IN (
        'team.member_removed',
        'committee.member_removed'
      )
    `);

    for (const table of ['team_memberships', 'committee_memberships']) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM "${table}"
            WHERE "seasonKey" IS NULL OR "startedOn" IS NULL
          ) THEN
            RAISE EXCEPTION '${table} contains a membership without a resolvable season';
          END IF;
        END
        $$
      `);
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ALTER COLUMN "seasonKey" SET NOT NULL,
        ALTER COLUMN "startedOn" SET NOT NULL,
        ADD CONSTRAINT "CHK_${table}_season_key"
          CHECK ("seasonKey" BETWEEN 1900 AND 3000),
        ADD CONSTRAINT "CHK_${table}_dates"
          CHECK (
            "startedOn" >= make_date("seasonKey", 8, 1)
            AND "startedOn" < make_date("seasonKey" + 1, 8, 1)
            AND (
              "endedOn" IS NULL
              OR (
                "endedOn" >= "startedOn"
                AND "endedOn" < make_date("seasonKey" + 1, 8, 1)
              )
            )
          )
      `);
    }

    await queryRunner.query(
      'ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_team_memberships_season"',
    );
    await queryRunner.query(
      'ALTER TABLE "committee_memberships" DROP CONSTRAINT "FK_committee_memberships_season"',
    );
    await queryRunner.query('DROP INDEX "IDX_team_memberships_season"');
    await queryRunner.query('DROP INDEX "IDX_committee_memberships_season"');
    await queryRunner.query(
      'ALTER TABLE "team_memberships" DROP COLUMN "seasonId"',
    );
    await queryRunner.query(
      'ALTER TABLE "committee_memberships" DROP COLUMN "seasonId"',
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_team_memberships_active_assignment"
      ON "team_memberships" ("userId", "teamId", "seasonKey", "role")
      WHERE "endedOn" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_committee_memberships_active_assignment"
      ON "committee_memberships" (
        "userId", "committeeId", "seasonKey", "role"
      )
      WHERE "endedOn" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_team_memberships_active_season"
      ON "team_memberships" ("seasonKey")
      WHERE "endedOn" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_committee_memberships_active_season"
      ON "committee_memberships" ("seasonKey")
      WHERE "endedOn" IS NULL
    `);

    await queryRunner.query('DROP TABLE "seasons"');
  }

  public async down(): Promise<void> {
    throw new Error(
      'ReplaceSeasonsWithSeasonKeys cannot be reverted without discarding preserved membership history.',
    );
  }

  private async restoreEndedMemberships(
    queryRunner: QueryRunner,
    membershipTable: string,
    parentIdColumn: string,
    assignedEventType: string,
    removedEventType: string,
    parentTable: string,
  ): Promise<void> {
    await queryRunner.query(`
      WITH latest_assignment AS (
        SELECT DISTINCT ON (event."aggregateId")
          event."aggregateId",
          event."sequence",
          event."payload",
          event."occurredAt"
        FROM "stored_events" event
        WHERE event."eventType" = '${assignedEventType}'
        ORDER BY event."aggregateId", event."sequence" DESC
      ),
      first_removal AS (
        SELECT DISTINCT ON (event."aggregateId")
          event."aggregateId",
          event."occurredAt"
        FROM "stored_events" event
        INNER JOIN latest_assignment assignment
          ON assignment."aggregateId" = event."aggregateId"
          AND event."sequence" > assignment."sequence"
        WHERE event."eventType" = '${removedEventType}'
        ORDER BY event."aggregateId", event."sequence" ASC
      )
      INSERT INTO "${membershipTable}" (
        "id",
        "userId",
        "${parentIdColumn}",
        "role",
        "seasonId",
        "seasonKey",
        "startedOn",
        "endedOn",
        "createdAt",
        "updatedAt"
      )
      SELECT
        (assignment."payload"->>'membershipId')::uuid,
        (assignment."payload"->>'userId')::uuid,
        (assignment."payload"->>'${parentIdColumn}')::uuid,
        assignment."payload"->>'role',
        season."id",
        EXTRACT(
          YEAR FROM season."startsAt" AT TIME ZONE 'Europe/Amsterdam'
        )::smallint,
        (season."startsAt" AT TIME ZONE 'Europe/Amsterdam')::date,
        GREATEST(
          LEAST(
            (removal."occurredAt" AT TIME ZONE 'Europe/Amsterdam')::date,
            (
              (season."startsAt" AT TIME ZONE 'Europe/Amsterdam')
              + INTERVAL '1 year' - INTERVAL '1 day'
            )::date
          ),
          (season."startsAt" AT TIME ZONE 'Europe/Amsterdam')::date
        ),
        assignment."occurredAt",
        removal."occurredAt"
      FROM latest_assignment assignment
      INNER JOIN first_removal removal
        ON removal."aggregateId" = assignment."aggregateId"
      INNER JOIN "seasons" season
        ON season."id"::text = assignment."payload"->>'seasonId'
      INNER JOIN "users" app_user
        ON app_user."id"::text = assignment."payload"->>'userId'
      INNER JOIN "${parentTable}" parent
        ON parent."id"::text = assignment."payload"->>'${parentIdColumn}'
      ON CONFLICT ("id") DO NOTHING
    `);
  }
}
