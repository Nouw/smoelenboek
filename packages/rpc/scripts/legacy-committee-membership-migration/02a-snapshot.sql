-- Export this result before running 03-migrate.sql to:
-- /tmp/legacy-committee-membership-migration/pre-migration-target-rows.csv
SELECT
  s."legacyMembershipId" AS legacy_membership_id,
  s."legacyUserId" AS legacy_user_id,
  lower(btrim(s.email)) AS email,
  s."legacyCommitteeId" AS legacy_committee_id,
  s."legacySeasonId" AS legacy_season_id,
  app_user.id AS user_id,
  COALESCE(mapped_committee."committeeId", named_committee.id) AS committee_id,
  s."committeeName" AS committee_name,
  CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
       THEN EXTRACT(YEAR FROM s."seasonStartsOn")
       ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END AS season_key,
  r.role,
  to_jsonb(existing) AS membership_before
FROM legacy_committee_membership_import_staging s
LEFT JOIN users app_user
  ON lower(btrim(app_user.email)) = lower(btrim(s.email))
LEFT JOIN legacy_committee_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
LEFT JOIN legacy_committee_migration_map mapped_committee
  ON mapped_committee."legacyCommitteeId" = s."legacyCommitteeId"
LEFT JOIN committees named_committee
  ON mapped_committee."committeeId" IS NULL
 AND lower(btrim(named_committee.name)) = lower(btrim(s."committeeName"))
LEFT JOIN committee_memberships existing
  ON existing."userId" = app_user.id
 AND existing."committeeId" = COALESCE(mapped_committee."committeeId", named_committee.id)
 AND existing."seasonKey" = (
   CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
        THEN EXTRACT(YEAR FROM s."seasonStartsOn")
        ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END
 )::smallint
 AND existing.role = r.role
ORDER BY s."legacyMembershipId", existing."createdAt";
