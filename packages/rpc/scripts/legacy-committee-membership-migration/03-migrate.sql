-- Keep this console open. This file intentionally leaves the transaction open.
-- Run 04-report.sql next, then execute exactly one COMMIT or ROLLBACK.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('smoelenboek-legacy-committee-membership-migration'));
SET CONSTRAINTS ALL DEFERRED;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM legacy_committee_membership_import_staging
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
       ) NOT BETWEEN 1900 AND 3000
  ) THEN RAISE EXCEPTION 'Preflight failed: missing or invalid required value'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_committee_membership_import_staging
    GROUP BY "legacyMembershipId" HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: duplicate legacy membership id'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_committee_membership_import_staging
    GROUP BY "legacyUserId"
    HAVING count(DISTINCT lower(btrim(email))) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy user id has multiple emails'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_committee_membership_import_staging
    GROUP BY lower(btrim(email))
    HAVING count(DISTINCT "legacyUserId") > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: email has multiple legacy user ids'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_committee_membership_import_staging
    GROUP BY "legacyCommitteeId"
    HAVING count(DISTINCT lower(btrim("committeeName"))) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy committee id has multiple names'; END IF;

  IF EXISTS (
    SELECT 1 FROM legacy_committee_membership_import_staging
    GROUP BY lower(btrim("committeeName"))
    HAVING count(DISTINCT "legacyCommitteeId") > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: committee name has multiple legacy ids'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_committee_membership_import_staging s
    LEFT JOIN legacy_committee_role_import_map r
      ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
    WHERE r.role IS NULL
  ) THEN RAISE EXCEPTION 'Preflight failed: unknown committee function'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_committee_membership_import_staging s
    LEFT JOIN users app_user
      ON lower(btrim(app_user.email)) = lower(btrim(s.email))
    GROUP BY s."legacyUserId"
    HAVING count(DISTINCT app_user.id) <> 1
  ) THEN RAISE EXCEPTION 'Preflight failed: email does not resolve exactly one user'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_committee_membership_import_staging s
    LEFT JOIN legacy_committee_migration_map m
      ON m."legacyCommitteeId" = s."legacyCommitteeId"
    LEFT JOIN committees t
      ON lower(btrim(t.name)) = lower(btrim(s."committeeName"))
    WHERE m."committeeId" IS NULL
    GROUP BY s."legacyCommitteeId"
    HAVING count(DISTINCT t.id) <> 1
  ) THEN RAISE EXCEPTION 'Preflight failed: committee name does not resolve exactly once'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_committee_membership_import_staging s
    JOIN legacy_committee_migration_map m
      ON m."legacyCommitteeId" = s."legacyCommitteeId"
    JOIN committees t ON t.id = m."committeeId"
    WHERE lower(btrim(t.name)) <> lower(btrim(s."committeeName"))
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy committee map points to another committee'; END IF;
END $$;

CREATE TEMP TABLE legacy_committee_maps_before ON COMMIT DROP AS
SELECT map.*
FROM legacy_committee_migration_map map
JOIN (
  SELECT DISTINCT "legacyCommitteeId"
  FROM legacy_committee_membership_import_staging
) staged ON staged."legacyCommitteeId" = map."legacyCommitteeId";

CREATE TEMP TABLE legacy_membership_maps_before ON COMMIT DROP AS
SELECT map.*
FROM legacy_committee_membership_migration_map map
JOIN legacy_committee_membership_import_staging staged
  ON staged."legacyMembershipId" = map."legacyMembershipId";

INSERT INTO legacy_committee_migration_map ("legacyCommitteeId", "committeeId")
SELECT DISTINCT s."legacyCommitteeId", committee.id
FROM legacy_committee_membership_import_staging s
JOIN committees committee
  ON lower(btrim(committee.name)) = lower(btrim(s."committeeName"))
LEFT JOIN legacy_committee_migration_map map
  ON map."legacyCommitteeId" = s."legacyCommitteeId"
WHERE map."legacyCommitteeId" IS NULL;

CREATE TEMP TABLE legacy_committee_membership_resolved ON COMMIT DROP AS
SELECT
  s."legacyMembershipId",
  s."legacyUserId",
  lower(btrim(s.email)) AS email,
  s."legacyCommitteeId",
  s."legacySeasonId",
  s."seasonStartsOn",
  app_user.id AS "userId",
  committee_map."committeeId",
  role_map.role,
  CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
       THEN EXTRACT(YEAR FROM s."seasonStartsOn")
       ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END::smallint AS "seasonKey"
FROM legacy_committee_membership_import_staging s
JOIN users app_user
  ON lower(btrim(app_user.email)) = lower(btrim(s.email))
JOIN legacy_committee_migration_map committee_map
  ON committee_map."legacyCommitteeId" = s."legacyCommitteeId"
JOIN legacy_committee_role_import_map role_map
  ON role_map."legacyFunction" = lower(btrim(s."legacyFunction"));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM legacy_committee_membership_resolved
    GROUP BY "userId", "committeeId", "seasonKey", role
    HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: duplicate legacy assignment'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_committee_membership_resolved resolved
    JOIN committee_memberships existing
      ON existing."userId" = resolved."userId"
     AND existing."committeeId" = resolved."committeeId"
     AND existing."seasonKey" = resolved."seasonKey"
     AND existing.role = resolved.role
    GROUP BY resolved."legacyMembershipId"
    HAVING count(existing.id) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: ambiguous existing membership'; END IF;

  IF EXISTS (
    SELECT 1
    FROM legacy_committee_membership_resolved resolved
    JOIN legacy_committee_membership_migration_map map
      ON map."legacyMembershipId" = resolved."legacyMembershipId"
    JOIN committee_memberships membership ON membership.id = map."membershipId"
    WHERE membership."userId" <> resolved."userId"
       OR membership."committeeId" <> resolved."committeeId"
       OR membership."seasonKey" <> resolved."seasonKey"
       OR membership.role <> resolved.role
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy membership map points elsewhere'; END IF;
END $$;

INSERT INTO legacy_committee_membership_migration_map (
  "legacyMembershipId", "membershipId"
)
SELECT
  resolved."legacyMembershipId",
  COALESCE(existing.id, gen_random_uuid())
FROM legacy_committee_membership_resolved resolved
LEFT JOIN committee_memberships existing
  ON existing."userId" = resolved."userId"
 AND existing."committeeId" = resolved."committeeId"
 AND existing."seasonKey" = resolved."seasonKey"
 AND existing.role = resolved.role
LEFT JOIN legacy_committee_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
WHERE map."legacyMembershipId" IS NULL;

CREATE TEMP TABLE legacy_committee_memberships_before ON COMMIT DROP AS
SELECT membership.*
FROM legacy_committee_membership_migration_map map
JOIN legacy_committee_membership_import_staging staged
  ON staged."legacyMembershipId" = map."legacyMembershipId"
JOIN committee_memberships membership ON membership.id = map."membershipId";

CREATE TEMP TABLE legacy_assignment_events_before ON COMMIT DROP AS
SELECT event.*
FROM legacy_committee_membership_migration_map map
JOIN legacy_committee_membership_import_staging staged
  ON staged."legacyMembershipId" = map."legacyMembershipId"
JOIN stored_events event
  ON event."aggregateType" = 'committee_membership'
 AND event."aggregateId" = map."membershipId"::text
 AND event."eventType" = 'committee.member_assigned';

INSERT INTO committee_memberships (
  id, "userId", "committeeId", "seasonKey", role, "startedOn", "endedOn",
  "createdAt", "updatedAt"
)
SELECT
  map."membershipId",
  resolved."userId",
  resolved."committeeId",
  resolved."seasonKey",
  resolved.role,
  resolved."seasonStartsOn",
  NULL,
  (resolved."seasonStartsOn" + 1)::timestamp AT TIME ZONE 'Europe/Amsterdam',
  (resolved."seasonStartsOn" + 1)::timestamp AT TIME ZONE 'Europe/Amsterdam'
FROM legacy_committee_membership_resolved resolved
JOIN legacy_committee_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
ON CONFLICT (id) DO NOTHING;

INSERT INTO stored_events (
  "aggregateType", "aggregateId", "eventType", "eventVersion",
  payload, metadata, "occurredAt"
)
SELECT
  'committee_membership',
  map."membershipId"::text,
  'committee.member_assigned',
  2,
  jsonb_build_object(
    'membershipId', map."membershipId"::text,
    'userId', resolved."userId"::text,
    'committeeId', resolved."committeeId"::text,
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
FROM legacy_committee_membership_resolved resolved
JOIN legacy_committee_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
WHERE NOT EXISTS (
  SELECT 1 FROM stored_events event
  WHERE event."aggregateType" = 'committee_membership'
    AND event."aggregateId" = map."membershipId"::text
    AND event."eventType" = 'committee.member_assigned'
);

-- No COMMIT here. Run 04-report.sql in this same console next.
