-- Run against PostgreSQL after the application migrations have completed.
CREATE TABLE IF NOT EXISTS legacy_team_membership_import_staging (
  "legacyMembershipId" bigint,
  "legacyUserId" bigint,
  "legacyTeamId" bigint,
  "teamName" text,
  "legacySeasonId" bigint,
  "seasonStartsOn" date,
  "legacyFunction" text
);

CREATE TABLE IF NOT EXISTS legacy_team_role_import_map (
  "legacyFunction" text PRIMARY KEY,
  "role" character varying NOT NULL,
  CONSTRAINT "CHK_legacy_team_role_import_map_role" CHECK (
    "role" IN (
      'libero',
      'middle',
      'coach_trainer',
      'setter',
      'outside_hitter',
      'opposite_hitter'
    )
  )
);

INSERT INTO legacy_team_role_import_map ("legacyFunction", "role")
VALUES
  ('coach / trainer', 'coach_trainer'),
  ('middle', 'middle'),
  ('outside hitter', 'outside_hitter'),
  ('opposite hitter', 'opposite_hitter'),
  ('libero', 'libero'),
  ('setter', 'setter')
ON CONFLICT ("legacyFunction") DO UPDATE SET "role" = EXCLUDED."role";

TRUNCATE TABLE legacy_team_membership_import_staging;
