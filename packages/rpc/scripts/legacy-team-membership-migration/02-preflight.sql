-- Every query below must return zero rows before 03-migrate.sql is run.

-- Missing values or dates outside the supported season range.
SELECT *, 'missing or invalid required value' AS issue
FROM legacy_team_membership_import_staging
WHERE "legacyMembershipId" IS NULL
   OR "legacyUserId" IS NULL
   OR "legacyTeamId" IS NULL
   OR NULLIF(btrim("teamName"), '') IS NULL
   OR "legacySeasonId" IS NULL
   OR "seasonStartsOn" IS NULL
   OR NULLIF(btrim("legacyFunction"), '') IS NULL
   OR (
     CASE WHEN EXTRACT(MONTH FROM "seasonStartsOn") >= 8
          THEN EXTRACT(YEAR FROM "seasonStartsOn")
          ELSE EXTRACT(YEAR FROM "seasonStartsOn") - 1 END
   ) NOT BETWEEN 1900 AND 3000;

SELECT "legacyMembershipId" AS value, count(*) AS occurrences,
       'duplicate legacy membership id' AS issue
FROM legacy_team_membership_import_staging
GROUP BY "legacyMembershipId"
HAVING count(*) > 1;

-- One legacy team ID and one normalized team name must remain one-to-one.
SELECT "legacyTeamId" AS value, count(DISTINCT lower(btrim("teamName"))) AS occurrences,
       'legacy team id has multiple names' AS issue
FROM legacy_team_membership_import_staging
GROUP BY "legacyTeamId"
HAVING count(DISTINCT lower(btrim("teamName"))) > 1;

SELECT lower(btrim("teamName")) AS value, count(DISTINCT "legacyTeamId") AS occurrences,
       'team name has multiple legacy ids' AS issue
FROM legacy_team_membership_import_staging
GROUP BY lower(btrim("teamName"))
HAVING count(DISTINCT "legacyTeamId") > 1;

-- All legacy functions must have an explicit mapping to the new role enum.
SELECT DISTINCT s."legacyFunction", 'unknown team function' AS issue
FROM legacy_team_membership_import_staging s
LEFT JOIN legacy_team_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
WHERE r."role" IS NULL;

-- Users must already have been migrated by the user migration.
SELECT DISTINCT s."legacyUserId", 'missing legacy user map' AS issue
FROM legacy_team_membership_import_staging s
LEFT JOIN legacy_user_migration_map u
  ON u."legacyUserId" = s."legacyUserId"
WHERE u."userId" IS NULL;

-- An unmapped legacy team name must match exactly one PostgreSQL team.
SELECT s."legacyTeamId", min(s."teamName") AS "teamName",
       count(DISTINCT t.id) AS matches,
       'team name does not resolve exactly once' AS issue
FROM legacy_team_membership_import_staging s
LEFT JOIN legacy_team_migration_map m
  ON m."legacyTeamId" = s."legacyTeamId"
LEFT JOIN teams t
  ON lower(btrim(t.name)) = lower(btrim(s."teamName"))
WHERE m."teamId" IS NULL
GROUP BY s."legacyTeamId"
HAVING count(DISTINCT t.id) <> 1;

-- A durable team map may not silently move to a differently named team.
SELECT s."legacyTeamId", s."teamName", t.id AS "mappedTeamId", t.name AS "mappedTeamName",
       'legacy team map points to another team name' AS issue
FROM legacy_team_membership_import_staging s
JOIN legacy_team_migration_map m
  ON m."legacyTeamId" = s."legacyTeamId"
JOIN teams t ON t.id = m."teamId"
WHERE lower(btrim(t.name)) <> lower(btrim(s."teamName"));

-- The same assignment may only occur once in the legacy export.
SELECT u."userId", COALESCE(mapped_team."teamId", named_team.id) AS "teamId",
       CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
            THEN EXTRACT(YEAR FROM s."seasonStartsOn")
            ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END AS "seasonKey",
       r."role", count(*) AS occurrences, 'duplicate legacy assignment' AS issue
FROM legacy_team_membership_import_staging s
JOIN legacy_user_migration_map u ON u."legacyUserId" = s."legacyUserId"
JOIN legacy_team_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
LEFT JOIN legacy_team_migration_map mapped_team
  ON mapped_team."legacyTeamId" = s."legacyTeamId"
LEFT JOIN teams named_team
  ON mapped_team."teamId" IS NULL
 AND lower(btrim(named_team.name)) = lower(btrim(s."teamName"))
GROUP BY u."userId", COALESCE(mapped_team."teamId", named_team.id),
         CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
              THEN EXTRACT(YEAR FROM s."seasonStartsOn")
              ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END,
         r."role"
HAVING count(*) > 1;

-- A staged row may match at most one existing projection row.
SELECT s."legacyMembershipId", count(existing.id) AS matches,
       'multiple existing memberships match the legacy assignment' AS issue
FROM legacy_team_membership_import_staging s
JOIN legacy_user_migration_map u ON u."legacyUserId" = s."legacyUserId"
JOIN legacy_team_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
LEFT JOIN legacy_team_migration_map mapped_team
  ON mapped_team."legacyTeamId" = s."legacyTeamId"
LEFT JOIN teams named_team
  ON mapped_team."teamId" IS NULL
 AND lower(btrim(named_team.name)) = lower(btrim(s."teamName"))
JOIN team_memberships existing
  ON existing."userId" = u."userId"
 AND existing."teamId" = COALESCE(mapped_team."teamId", named_team.id)
 AND existing."seasonKey" = (
   CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
        THEN EXTRACT(YEAR FROM s."seasonStartsOn")
        ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END
 )::smallint
 AND existing.role = r.role
GROUP BY s."legacyMembershipId"
HAVING count(existing.id) > 1;

-- An existing durable membership map must still describe the same assignment.
SELECT s."legacyMembershipId", membership.id AS "mappedMembershipId",
       'legacy membership map points to another assignment' AS issue
FROM legacy_team_membership_import_staging s
JOIN legacy_user_migration_map u ON u."legacyUserId" = s."legacyUserId"
JOIN legacy_team_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
JOIN legacy_team_membership_migration_map map
  ON map."legacyMembershipId" = s."legacyMembershipId"
JOIN team_memberships membership ON membership.id = map."membershipId"
LEFT JOIN legacy_team_migration_map mapped_team
  ON mapped_team."legacyTeamId" = s."legacyTeamId"
LEFT JOIN teams named_team
  ON mapped_team."teamId" IS NULL
 AND lower(btrim(named_team.name)) = lower(btrim(s."teamName"))
WHERE membership."userId" <> u."userId"
   OR membership."teamId" <> COALESCE(mapped_team."teamId", named_team.id)
   OR membership."seasonKey" <> (
     CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
          THEN EXTRACT(YEAR FROM s."seasonStartsOn")
          ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END
   )::smallint
   OR membership.role <> r.role;
