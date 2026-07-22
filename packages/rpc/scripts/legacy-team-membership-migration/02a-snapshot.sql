-- Export this result before running 03-migrate.sql to:
-- /tmp/legacy-team-membership-migration/pre-migration-target-rows.csv
SELECT
  s."legacyMembershipId" AS legacy_membership_id,
  s."legacyUserId" AS legacy_user_id,
  lower(btrim(s.email)) AS email,
  s."legacyTeamId" AS legacy_team_id,
  s."legacySeasonId" AS legacy_season_id,
  app_user.id AS user_id,
  COALESCE(mapped_team."teamId", named_team.id) AS team_id,
  s."teamName" AS team_name,
  CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
       THEN EXTRACT(YEAR FROM s."seasonStartsOn")
       ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END AS season_key,
  r.role,
  to_jsonb(existing) AS membership_before
FROM legacy_team_membership_import_staging s
LEFT JOIN users app_user
  ON lower(btrim(app_user.email)) = lower(btrim(s.email))
LEFT JOIN legacy_team_role_import_map r
  ON r."legacyFunction" = lower(btrim(s."legacyFunction"))
LEFT JOIN legacy_team_migration_map mapped_team
  ON mapped_team."legacyTeamId" = s."legacyTeamId"
LEFT JOIN teams named_team
  ON mapped_team."teamId" IS NULL
 AND lower(btrim(named_team.name)) = lower(btrim(s."teamName"))
LEFT JOIN team_memberships existing
  ON existing."userId" = app_user.id
 AND existing."teamId" = COALESCE(mapped_team."teamId", named_team.id)
 AND existing."seasonKey" = (
   CASE WHEN EXTRACT(MONTH FROM s."seasonStartsOn") >= 8
        THEN EXTRACT(YEAR FROM s."seasonStartsOn")
        ELSE EXTRACT(YEAR FROM s."seasonStartsOn") - 1 END
 )::smallint
 AND existing.role = r.role
ORDER BY s."legacyMembershipId", existing."createdAt";
