-- Run in the same console while the 03-migrate.sql transaction is still open.
SELECT
  count(DISTINCT resolved."legacyMembershipId") AS staged_memberships,
  count(DISTINCT resolved."legacyCommitteeId")
    FILTER (WHERE committee_before."legacyCommitteeId" IS NULL) AS committee_maps_created,
  count(DISTINCT resolved."legacyCommitteeId")
    FILTER (WHERE committee_before."legacyCommitteeId" IS NOT NULL) AS committee_maps_preserved,
  count(DISTINCT resolved."legacyMembershipId")
    FILTER (WHERE membership_before.id IS NULL) AS memberships_created,
  count(DISTINCT resolved."legacyMembershipId")
    FILTER (WHERE membership_before.id IS NOT NULL) AS memberships_matched,
  count(DISTINCT resolved."legacyMembershipId")
    FILTER (WHERE event_before.id IS NULL) AS assignment_events_created,
  count(DISTINCT resolved."legacyMembershipId")
    FILTER (WHERE event_before.id IS NOT NULL) AS assignment_events_preserved
FROM legacy_committee_membership_resolved resolved
LEFT JOIN legacy_committee_maps_before committee_before
  ON committee_before."legacyCommitteeId" = resolved."legacyCommitteeId"
LEFT JOIN legacy_committee_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
LEFT JOIN legacy_committee_memberships_before membership_before
  ON membership_before.id = map."membershipId"
LEFT JOIN legacy_assignment_events_before event_before
  ON event_before."aggregateId" = map."membershipId"::text;

-- Every count must be zero.
SELECT
  count(*) FILTER (WHERE committee_map."committeeId" IS NULL) AS missing_committee_maps,
  count(*) FILTER (WHERE membership_map."membershipId" IS NULL) AS missing_membership_maps,
  count(*) FILTER (WHERE membership.id IS NULL) AS missing_memberships,
  count(*) FILTER (WHERE event.id IS NULL) AS missing_assignment_events,
  count(*) FILTER (
    WHERE membership.id IS NOT NULL AND (
      membership."userId" <> resolved."userId"
      OR membership."committeeId" <> resolved."committeeId"
      OR membership."seasonKey" <> resolved."seasonKey"
      OR membership.role <> resolved.role
      OR (
        membership_before.id IS NULL
        AND membership."startedOn" <> resolved."seasonStartsOn"
      )
    )
  ) AS mismatched_memberships
FROM legacy_committee_membership_resolved resolved
LEFT JOIN legacy_committee_migration_map committee_map
  ON committee_map."legacyCommitteeId" = resolved."legacyCommitteeId"
LEFT JOIN legacy_committee_membership_migration_map membership_map
  ON membership_map."legacyMembershipId" = resolved."legacyMembershipId"
LEFT JOIN committee_memberships membership
  ON membership.id = membership_map."membershipId"
LEFT JOIN legacy_committee_memberships_before membership_before
  ON membership_before.id = membership.id
LEFT JOIN stored_events event
  ON event."aggregateType" = 'committee_membership'
 AND event."aggregateId" = membership_map."membershipId"::text
 AND event."eventType" = 'committee.member_assigned';

-- Export this result to:
-- /tmp/legacy-committee-membership-migration/summary-before-after.csv
SELECT
  resolved."legacyMembershipId" AS legacy_membership_id,
  map."membershipId" AS membership_id,
  resolved."legacyUserId" AS legacy_user_id,
  resolved.email,
  resolved."userId" AS user_id,
  resolved."legacyCommitteeId" AS legacy_committee_id,
  committee.name AS committee_name,
  resolved."legacySeasonId" AS legacy_season_id,
  resolved."seasonKey" AS season_key,
  resolved."seasonStartsOn" AS started_on,
  resolved.role,
  CASE WHEN membership_before.id IS NULL THEN 'created' ELSE 'matched' END
    AS membership_action,
  membership."createdAt" AS created_at
FROM legacy_committee_membership_resolved resolved
JOIN legacy_committee_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
JOIN committee_memberships membership ON membership.id = map."membershipId"
JOIN committees committee ON committee.id = resolved."committeeId"
LEFT JOIN legacy_committee_memberships_before membership_before
  ON membership_before.id = membership.id
ORDER BY resolved."legacyMembershipId";

-- Export this result to:
-- /tmp/legacy-committee-membership-migration/full-before-after.csv
SELECT
  resolved."legacyMembershipId" AS legacy_membership_id,
  map."membershipId" AS membership_id,
  to_jsonb(membership_before) AS membership_before,
  to_jsonb(membership) AS membership_after
FROM legacy_committee_membership_resolved resolved
JOIN legacy_committee_membership_migration_map map
  ON map."legacyMembershipId" = resolved."legacyMembershipId"
JOIN committee_memberships membership ON membership.id = map."membershipId"
LEFT JOIN legacy_committee_memberships_before membership_before
  ON membership_before.id = membership.id
ORDER BY resolved."legacyMembershipId";

-- After reviewing/exporting, execute exactly one of these manually.
-- COMMIT;
-- ROLLBACK;
