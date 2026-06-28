import { MigrationInterface, QueryRunner } from 'typeorm';

const teamNames = [
  'Heren 1',
  'Heren 2',
  'Heren 3',
  'Heren 4',
  'Heren 5',
  'Heren 6',
  'Heren 7',
  'Dames 1',
  'Dames 2',
  'Dames 3',
  'Dames 4',
  'Dames 5',
  'Dames 6',
  'Dames 7',
  'Dames 8',
  'Dames 9',
  'Dames 10',
  'Dames 11',
];

const committeeNames = [
  'Bestuur',
  'Commissie van beroep',
  'Webcommissie',
  'Technische commissie',
  'Feestcommissie',
  'Toernooicommissie',
  'Kascommissie',
  'Weekendcommissie',
  'Adviescommissie',
  'Naadjecommissie',
  'PR commissie',
  'Beachcommissie',
  'Jaarboekcommissie',
  'Galacommissie',
  'Scheidsrechterscommissie (VIS)',
  'Trainerscommissie',
  'Snowcommissie',
  'CTVVCK',
  'Goede doelencommissie',
  'SocialCie',
  'Lustrumcommissie',
  'Inclusiviteitscommissie',
];

export class CreateTeamsCommitteesMemberships1767100000000
  implements MigrationInterface
{
  name = 'CreateTeamsCommitteesMemberships1767100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "archivedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_teams_name" UNIQUE ("name"),
        CONSTRAINT "PK_teams_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "committees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "archivedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_committees_name" UNIQUE ("name"),
        CONSTRAINT "PK_committees_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "team_memberships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "teamId" uuid NOT NULL,
        "seasonId" uuid NOT NULL,
        "role" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_team_memberships_assignment" UNIQUE ("userId", "teamId", "seasonId", "role"),
        CONSTRAINT "PK_team_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_team_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_memberships_team" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_memberships_season" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "committee_memberships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "committeeId" uuid NOT NULL,
        "seasonId" uuid NOT NULL,
        "role" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_committee_memberships_assignment" UNIQUE ("userId", "committeeId", "seasonId", "role"),
        CONSTRAINT "PK_committee_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_committee_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_committee_memberships_committee" FOREIGN KEY ("committeeId") REFERENCES "committees"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_committee_memberships_season" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_team_memberships_season" ON "team_memberships" ("seasonId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_team_memberships_user" ON "team_memberships" ("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_committee_memberships_season" ON "committee_memberships" ("seasonId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_committee_memberships_user" ON "committee_memberships" ("userId")',
    );

    for (const name of teamNames) {
      await queryRunner.query(
        'INSERT INTO "teams" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING',
        [name],
      );
    }

    for (const name of committeeNames) {
      await queryRunner.query(
        'INSERT INTO "committees" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING',
        [name],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_committee_memberships_user"');
    await queryRunner.query('DROP INDEX "IDX_committee_memberships_season"');
    await queryRunner.query('DROP INDEX "IDX_team_memberships_user"');
    await queryRunner.query('DROP INDEX "IDX_team_memberships_season"');
    await queryRunner.query('DROP TABLE "committee_memberships"');
    await queryRunner.query('DROP TABLE "team_memberships"');
    await queryRunner.query('DROP TABLE "committees"');
    await queryRunner.query('DROP TABLE "teams"');
  }
}

