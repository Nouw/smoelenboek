-- Run in the same console while the 03-migrate.sql transaction is still open.
SELECT
  count(DISTINCT resolved."legacyMembershipId") AS staged_memberships,
  count(DISTINCT resolved."legacyTeamId")
    FILTER (WHERE team_before."legacyTeamId" IS NULL) AS team_maps_created,
  count(DISTINCT resolved."legacyTeamId")
    FILTER (WHERE team_before."legacyTeamId" IS NOT NULL) AS team_maps_preserved,
  count(DISTINCT resolved."legacyMembershipId")
    FILTER (WHERE membership_before.id IS NULL) AS memberships_created,
  count(DISTINCT resolved."legacyMembershipId")
    FILTER (WHERE membership_before.id IS NOT NULL) AS memberships_matched,
  count(DISTINCT resolved."legacyMembershipId")
    FILTER (WHERE event_before.id IS NULL) AS assignment_events_created,
  count(DISTINCT resolved."legacyMembershipId")
    FILTER (WHERE event_before.id IS NOT NULL) AS assignment_events_preserved
FROM legacy_team_membership_resolved resolved
LEFT JOIN legacy_team_maps_before team_before
  ON team_before."legacyTeamId" = resolved."legacyTeamId"
LEFT JOIN legacy_team_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
LEFT JOIN legacy_team_memberships_before membership_before
  ON membership_before.id = map."membershipId"
LEFT JOIN legacy_assignment_events_before event_before
  ON event_before."aggregateId" = map."membershipId"::text;

-- Every count must be zero.
SELECT
  count(*) FILTER (WHERE team_map."teamId" IS NULL) AS missing_team_maps,
  count(*) FILTER (WHERE membership_map."membershipId" IS NULL) AS missing_membership_maps,
  count(*) FILTER (WHERE membership.id IS NULL) AS missing_memberships,
  count(*) FILTER (WHERE event.id IS NULL) AS missing_assignment_events,
  count(*) FILTER (
    WHERE membership.id IS NOT NULL AND (
      membership."userId" <> resolved."userId"
      OR membership."teamId" <> resolved."teamId"
      OR membership."seasonKey" <> resolved."seasonKey"
      OR membership.role <> resolved.role
      OR (
        membership_before.id IS NULL
        AND membership."startedOn" <> resolved."seasonStartsOn"
      )
    )
  ) AS mismatched_memberships
FROM legacy_team_membership_resolved resolved
LEFT JOIN legacy_team_migration_map team_map
  ON team_map."legacyTeamId" = resolved."legacyTeamId"
LEFT JOIN legacy_team_membership_migration_map membership_map
  ON membership_map."legacyMembershipId" = resolved."legacyMembershipId"
LEFT JOIN team_memberships membership
  ON membership.id = membership_map."membershipId"
LEFT JOIN legacy_team_memberships_before membership_before
  ON membership_before.id = membership.id
LEFT JOIN stored_events event
  ON event."aggregateType" = 'team_membership'
 AND event."aggregateId" = membership_map."membershipId"::text
 AND event."eventType" = 'team.member_assigned';

-- Export this result to:
-- /tmp/legacy-team-membership-migration/summary-before-after.csv
SELECT
  resolved."legacyMembershipId" AS legacy_membership_id,
  map."membershipId" AS membership_id,
  resolved."legacyUserId" AS legacy_user_id,
  resolved.email,
  resolved."userId" AS user_id,
  resolved."legacyTeamId" AS legacy_team_id,
  team.name AS team_name,
  resolved."legacySeasonId" AS legacy_season_id,
  resolved."seasonKey" AS season_key,
  resolved."seasonStartsOn" AS started_on,
  resolved.role,
  CASE WHEN membership_before.id IS NULL THEN 'created' ELSE 'matched' END
    AS membership_action,
  membership."createdAt" AS created_at
FROM legacy_team_membership_resolved resolved
JOIN legacy_team_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
JOIN team_memberships membership ON membership.id = map."membershipId"
JOIN teams team ON team.id = resolved."teamId"
LEFT JOIN legacy_team_memberships_before membership_before
  ON membership_before.id = membership.id
ORDER BY resolved."legacyMembershipId";

-- Export this result to:
-- /tmp/legacy-team-membership-migration/full-before-after.csv
SELECT
  resolved."legacyMembershipId" AS legacy_membership_id,
  map."membershipId" AS membership_id,
  to_jsonb(membership_before) AS membership_before,
  to_jsonb(membership) AS membership_after
FROM legacy_team_membership_resolved resolved
JOIN legacy_team_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
JOIN team_memberships membership ON membership.id = map."membershipId"
LEFT JOIN legacy_team_memberships_before membership_before
  ON membership_before.id = membership.id
ORDER BY resolved."legacyMembershipId";

-- After reviewing/exporting, execute exactly one of these manually.
-- COMMIT;
-- ROLLBACK;
