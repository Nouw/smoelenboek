-- Every query below must return zero rows before 03-migrate.sql is run.

-- Missing values or dates outside the supported season range.
SELECT *, 'missing or invalid required value' AS issue
FROM legacy_committee_membership_import_staging
WHERE "legacyMembershipId" IS NULL
   OR "legacyUserId" IS NULL
   OR NULLIF(btrim("email"), '') IS NULL
   OR btrim("email") !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
   OR "legacyCommitteeId" IS NULL
   OR NULLIF(btrim("committeeName"), '') IS NULL
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
FROM legacy_committee_membership_import_staging
GROUP BY "legacyMembershipId"
HAVING count(*) > 1;

-- One legacy user ID and one normalized email address must remain one-to-one.
SELECT "legacyUserId" AS value, count(DISTINCT lower(btrim("email"))) AS occurrences,
       'legacy user id has multiple email addresses' AS issue
FROM legacy_committee_membership_import_staging
GROUP BY "legacyUserId"
HAVING count(DISTINCT lower(btrim("email"))) > 1;

SELECT lower(btrim("email")) AS value, count(DISTINCT "legacyUserId") AS occurrences,
       'email address has multiple legacy user ids' AS issue
FROM legacy_committee_membership_import_staging
GROUP BY lower(btrim("email"))
HAVING count(DISTINCT "legacyUserId") > 1;

-- One legacy committee ID and one normalized committee name must remain one-to-one.
SELECT "legacyCommitteeId" AS value, count(DISTINCT lower(btrim("committeeName"))) AS occurrences,
       'legacy committee id has multiple names' AS issue
FROM legacy_committee_membership_import_staging
GROUP BY "legacyCommitteeId"
HAVING count(DISTINCT lower(btrim("committeeName"))) > 1;

SELECT lower(btrim("committeeName")) AS value, count(DISTINCT "legacyCommitteeId") AS occurrences,
       'committee name has multiple legacy ids' AS issue
FROM legacy_committee_membership_import_staging
GROUP BY lower(btrim("committeeName"))
HAVING count(DISTINCT "legacyCommitteeId") > 1;

-- All legacy functions must have an explicit mapping to the new role enum.
SELECT DISTINCT s."legacyFunction", 'unknown committee function' AS issue
FROM legacy_committee_membership_import_staging s
LEFT JOIN legacy_committee_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
WHERE r."role" IS NULL;

-- Each normalized email must match exactly one PostgreSQL user.
SELECT s."legacyUserId", min(s.email) AS email, count(DISTINCT app_user.id) AS matches,
       'email does not resolve exactly one PostgreSQL user' AS issue
FROM legacy_committee_membership_import_staging s
LEFT JOIN users app_user
  ON lower(btrim(app_user.email)) = lower(btrim(s.email))
GROUP BY s."legacyUserId"
HAVING count(DISTINCT app_user.id) <> 1;

-- An unmapped legacy committee name must match exactly one PostgreSQL committee.
SELECT s."legacyCommitteeId", min(s."committeeName") AS "committeeName",
       count(DISTINCT t.id) AS matches,
       'committee name does not resolve exactly once' AS issue
FROM legacy_committee_membership_import_staging s
LEFT JOIN legacy_committee_migration_map m
  ON m."legacyCommitteeId" = s."legacyCommitteeId"
LEFT JOIN committees t
  ON lower(btrim(t.name)) = lower(btrim(s."committeeName"))
WHERE m."committeeId" IS NULL
GROUP BY s."legacyCommitteeId"
HAVING count(DISTINCT t.id) <> 1;

-- A durable committee map may not silently move to a differently named committee.
SELECT s."legacyCommitteeId", s."committeeName", t.id AS "mappedCommitteeId", t.name AS "mappedCommitteeName",
       'legacy committee map points to another committee name' AS issue
FROM legacy_committee_membership_import_staging s
JOIN legacy_committee_migration_map m
  ON m."legacyCommitteeId" = s."legacyCommitteeId"
JOIN committees t ON t.id = m."committeeId"
WHERE lower(btrim(t.name)) <> lower(btrim(s."committeeName"));

-- The same assignment may only occur once in the legacy export.
SELECT app_user.id AS "userId",
       COALESCE(mapped_committee."committeeId", named_committee.id) AS "committeeId",
       CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
            THEN EXTRACT(YEAR FROM s."seasonStartsOn")
            ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END AS "seasonKey",
       r."role", count(*) AS occurrences, 'duplicate legacy assignment' AS issue
FROM legacy_committee_membership_import_staging s
JOIN users app_user
  ON lower(btrim(app_user.email)) = lower(btrim(s.email))
JOIN legacy_committee_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
LEFT JOIN legacy_committee_migration_map mapped_committee
  ON mapped_committee."legacyCommitteeId" = s."legacyCommitteeId"
LEFT JOIN committees named_committee
  ON mapped_committee."committeeId" IS NULL
 AND lower(btrim(named_committee.name)) = lower(btrim(s."committeeName"))
GROUP BY app_user.id, COALESCE(mapped_committee."committeeId", named_committee.id),
         CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
              THEN EXTRACT(YEAR FROM s."seasonStartsOn")
              ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END,
         r."role"
HAVING count(*) > 1;

-- A staged row may match at most one existing projection row.
SELECT s."legacyMembershipId", count(existing.id) AS matches,
       'multiple existing memberships match the legacy assignment' AS issue
FROM legacy_committee_membership_import_staging s
JOIN users app_user
  ON lower(btrim(app_user.email)) = lower(btrim(s.email))
JOIN legacy_committee_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
LEFT JOIN legacy_committee_migration_map mapped_committee
  ON mapped_committee."legacyCommitteeId" = s."legacyCommitteeId"
LEFT JOIN committees named_committee
  ON mapped_committee."committeeId" IS NULL
 AND lower(btrim(named_committee.name)) = lower(btrim(s."committeeName"))
JOIN committee_memberships existing
  ON existing."userId" = app_user.id
 AND existing."committeeId" = COALESCE(mapped_committee."committeeId", named_committee.id)
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
FROM legacy_committee_membership_import_staging s
JOIN users app_user
  ON lower(btrim(app_user.email)) = lower(btrim(s.email))
JOIN legacy_committee_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
JOIN legacy_committee_membership_migration_map map
  ON map."legacyMembershipId" = s."legacyMembershipId"
JOIN committee_memberships membership ON membership.id = map."membershipId"
LEFT JOIN legacy_committee_migration_map mapped_committee
  ON mapped_committee."legacyCommitteeId" = s."legacyCommitteeId"
LEFT JOIN committees named_committee
  ON mapped_committee."committeeId" IS NULL
 AND lower(btrim(named_committee.name)) = lower(btrim(s."committeeName"))
WHERE membership."userId" <> app_user.id
   OR membership."committeeId" <> COALESCE(mapped_committee."committeeId", named_committee.id)
   OR membership."seasonKey" <> (
     CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
          THEN EXTRACT(YEAR FROM s."seasonStartsOn")
          ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END
   )::smallint
   OR membership.role <> r.role;
