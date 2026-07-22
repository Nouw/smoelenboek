-- Keep this console open. This file intentionally leaves the transaction open.
-- Run 04-report.sql next, then execute exactly one COMMIT or ROLLBACK.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('smoelenboek-legacy-team-membership-migration'));
SET CONSTRAINTS ALL DEFERRED;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM legacy_team_membership_import_staging
    WHERE "legacyMembershipId" IS NULL
       OR "legacyUserId" IS NULL
       OR NULLIF(btrim("email"), '') IS NULL
       OR btrim("email") !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       OR "legacyTeamId" IS NULL
       OR NULLIF(btrim("teamName"), '') IS NULL
       OR "legacySeasonId" IS NULL
       OR "seasonStartsOn" IS NULL
       OR NULLIF(btrim("legacyFunction"), '') IS NULL
       OR (
         CASE WHEN EXTRACT(MONTH FROM "seasonStartsOn") >= 8
              THEN EXTRACT(YEAR FROM "seasonStartsOn")
              ELSE EXTRACT(YEAR FROM "seasonStartsOn") - 1 END
       ) NOT BETWEEN 1900 AND 3000
  ) THEN RAISE EXCEPTION 'Preflight failed: missing or invalid required value'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_team_membership_import_staging
    GROUP BY "legacyMembershipId" HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: duplicate legacy membership id'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_team_membership_import_staging
    GROUP BY "legacyUserId"
    HAVING count(DISTINCT lower(btrim(email))) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy user id has multiple emails'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_team_membership_import_staging
    GROUP BY lower(btrim(email))
    HAVING count(DISTINCT "legacyUserId") > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: email has multiple legacy user ids'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_team_membership_import_staging
    GROUP BY "legacyTeamId"
    HAVING count(DISTINCT lower(btrim("teamName"))) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy team id has multiple names'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_team_membership_import_staging
    GROUP BY lower(btrim("teamName"))
    HAVING count(DISTINCT "legacyTeamId") > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: team name has multiple legacy ids'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_team_membership_import_staging s
    LEFT JOIN legacy_team_role_import_map r
      ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
    WHERE r.role IS NULL
  ) THEN RAISE EXCEPTION 'Preflight failed: unknown team function'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_team_membership_import_staging s
    LEFT JOIN users app_user
      ON lower(btrim(app_user.email)) = lower(btrim(s.email))
    GROUP BY s."legacyUserId"
    HAVING count(DISTINCT app_user.id) <> 1
  ) THEN RAISE EXCEPTION 'Preflight failed: email does not resolve exactly one user'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_team_membership_import_staging s
    LEFT JOIN legacy_team_migration_map m
      ON m."legacyTeamId" = s."legacyTeamId"
    LEFT JOIN teams t
      ON lower(btrim(t.name)) = lower(btrim(s."teamName"))
    WHERE m."teamId" IS NULL
    GROUP BY s."legacyTeamId"
    HAVING count(DISTINCT t.id) <> 1
  ) THEN RAISE EXCEPTION 'Preflight failed: team name does not resolve exactly once'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_team_membership_import_staging s
    JOIN legacy_team_migration_map m
      ON m."legacyTeamId" = s."legacyTeamId"
    JOIN teams t ON t.id = m."teamId"
    WHERE lower(btrim(t.name)) <> lower(btrim(s."teamName"))
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy team map points to another team'; END IF;
END $$;

CREATE TEMP TABLE legacy_team_maps_before ON COMMIT DROP AS
SELECT map.*
FROM legacy_team_migration_map map
JOIN (
  SELECT DISTINCT "legacyTeamId"
  FROM legacy_team_membership_import_staging
) staged ON staged."legacyTeamId" = map."legacyTeamId";

CREATE TEMP TABLE legacy_membership_maps_before ON COMMIT DROP AS
SELECT map.*
FROM legacy_team_membership_migration_map map
JOIN legacy_team_membership_import_staging staged
  ON staged."legacyMembershipId" = map."legacyMembershipId";

INSERT INTO legacy_team_migration_map ("legacyTeamId", "teamId")
SELECT DISTINCT s."legacyTeamId", team.id
FROM legacy_team_membership_import_staging s
JOIN teams team
  ON lower(btrim(team.name)) = lower(btrim(s."teamName"))
LEFT JOIN legacy_team_migration_map map
  ON map."legacyTeamId" = s."legacyTeamId"
WHERE map."legacyTeamId" IS NULL;

CREATE TEMP TABLE legacy_team_membership_resolved ON COMMIT DROP AS
SELECT
  s."legacyMembershipId",
  s."legacyUserId",
  lower(btrim(s.email)) AS email,
  s."legacyTeamId",
  s."legacySeasonId",
  s."seasonStartsOn",
  app_user.id AS "userId",
  team_map."teamId",
  role_map.role,
  CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
       THEN EXTRACT(YEAR FROM s."seasonStartsOn")
       ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END::smallint AS "seasonKey"
FROM legacy_team_membership_import_staging s
JOIN users app_user
  ON lower(btrim(app_user.email)) = lower(btrim(s.email))
JOIN legacy_team_migration_map team_map
  ON team_map."legacyTeamId" = s."legacyTeamId"
JOIN legacy_team_role_import_map role_map
  ON role_map."legacyFunction" = lower(btrim(s."legacyFunction"));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM legacy_team_membership_resolved
    GROUP BY "userId", "teamId", "seasonKey", role
    HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: duplicate legacy assignment'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_team_membership_resolved resolved
    JOIN team_memberships existing
      ON existing."userId" = resolved."userId"
     AND existing."teamId" = resolved."teamId"
     AND existing."seasonKey" = resolved."seasonKey"
     AND existing.role = resolved.role
    GROUP BY resolved."legacyMembershipId"
    HAVING count(existing.id) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: ambiguous existing membership'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_team_membership_resolved resolved
    JOIN legacy_team_membership_migration_map map
      ON map."legacyMembershipId" = resolved."legacyMembershipId"
    JOIN team_memberships membership ON membership.id = map."membershipId"
    WHERE membership."userId" <> resolved."userId"
       OR membership."teamId" <> resolved."teamId"
       OR membership."seasonKey" <> resolved."seasonKey"
       OR membership.role <> resolved.role
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy membership map points elsewhere'; END IF;
END $$;

INSERT INTO legacy_team_membership_migration_map (
  "legacyMembershipId", "membershipId"
)
SELECT
  resolved."legacyMembershipId",
  COALESCE(existing.id, gen_random_uuid())
FROM legacy_team_membership_resolved resolved
LEFT JOIN team_memberships existing
  ON existing."userId" = resolved."userId"
 AND existing."teamId" = resolved."teamId"
 AND existing."seasonKey" = resolved."seasonKey"
 AND existing.role = resolved.role
LEFT JOIN legacy_team_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
WHERE map."legacyMembershipId" IS NULL;

CREATE TEMP TABLE legacy_team_memberships_before ON COMMIT DROP AS
SELECT membership.*
FROM legacy_team_membership_migration_map map
JOIN legacy_team_membership_import_staging staged
  ON staged."legacyMembershipId" = map."legacyMembershipId"
JOIN team_memberships membership ON membership.id = map."membershipId";

CREATE TEMP TABLE legacy_assignment_events_before ON COMMIT DROP AS
SELECT event.*
FROM legacy_team_membership_migration_map map
JOIN legacy_team_membership_import_staging staged
  ON staged."legacyMembershipId" = map."legacyMembershipId"
JOIN stored_events event
  ON event."aggregateType" = 'team_membership'
 AND event."aggregateId" = map."membershipId"::text
 AND event."eventType" = 'team.member_assigned';

INSERT INTO team_memberships (
  id, "userId", "teamId", "seasonKey", role, "startedOn", "endedOn",
  "createdAt", "updatedAt"
)
SELECT
  map."membershipId",
  resolved."userId",
  resolved."teamId",
  resolved."seasonKey",
  resolved.role,
  resolved."seasonStartsOn",
  NULL,
  (resolved."seasonStartsOn" + 1)::timestamp AT TIME ZONE 'Europe/Amsterdam',
  (resolved."seasonStartsOn" + 1)::timestamp AT TIME ZONE 'Europe/Amsterdam'
FROM legacy_team_membership_resolved resolved
JOIN legacy_team_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
ON CONFLICT (id) DO NOTHING;

INSERT INTO stored_events (
  "aggregateType", "aggregateId", "eventType", "eventVersion",
  payload, metadata, "occurredAt"
)
SELECT
  'team_membership',
  map."membershipId"::text,
  'team.member_assigned',
  2,
  jsonb_build_object(
    'membershipId', map."membershipId"::text,
    'userId', resolved."userId"::text,
    'teamId', resolved."teamId"::text,
    'seasonKey', resolved."seasonKey",
    'role', resolved.role,
    'startedOn', to_char(resolved."seasonStartsOn", 'YYYY-MM-DD'),
    'endedOn', NULL
  ),
  jsonb_build_object(
    'source', 'smoelenboek-v5-mysql',
    'legacyMembershipId', resolved."legacyMembershipId",
    'legacySeasonId', resolved."legacySeasonId"
  ),
  (resolved."seasonStartsOn" + 1)::timestamp AT TIME ZONE 'Europe/Amsterdam'
FROM legacy_team_membership_resolved resolved
JOIN legacy_team_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
WHERE NOT EXISTS (
  SELECT 1 FROM stored_events event
  WHERE event."aggregateType" = 'team_membership'
    AND event."aggregateId" = map."membershipId"::text
    AND event."eventType" = 'team.member_assigned'
);

-- No COMMIT here. Run 04-report.sql in this same console next.
