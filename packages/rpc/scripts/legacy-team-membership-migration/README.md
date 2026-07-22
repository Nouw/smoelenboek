# Legacy MySQL team membership migration

This runbook migrates `user_team_season` rows after the legacy user migration
has been committed. Numeric user, team, and membership IDs are retained in
durable mapping tables so later relation migrations can reuse them.

## Date and season mapping

- `seasonKey` is derived from the legacy `season.startDate` using the current
  August-to-July season policy.
- `startedOn` retains the exact legacy season start date.
- `createdAt`, event `occurredAt`, and the initial `updatedAt` are set to the
  legacy season start plus one day in `Europe/Amsterdam`, as requested.
- Membership history does not depend on `createdAt`. The explicit `seasonKey`
  remains the source of truth if audit timestamps are changed later.
- `endedOn` remains `NULL` because the legacy row records membership for a
  season but contains no reliable mid-season removal date.

## Function mapping

The old enum values are mapped as follows:

| Legacy function | New role        |
| --------------- | --------------- |
| Coach / Trainer | coach_trainer   |
| Middle          | middle          |
| Outside hitter  | outside_hitter  |
| Opposite hitter | opposite_hitter |
| Libero          | libero          |
| Setter          | setter          |

Unknown functions fail preflight. Do not guess a replacement in production.

## DataGrip workflow

1. Back up PostgreSQL and run the normal RPC migrations:

   ```bash
   pnpm --filter @repo/rpc migration:run
   ```

2. Confirm the user migration is committed and its durable map is populated:

   ```sql
   SELECT count(*) FROM legacy_user_migration_map;
   ```

3. In a PostgreSQL DataGrip console, run `01-create-staging.sql`.

4. In the old MySQL console, run:

   ```sql
   SELECT
     membership.id AS legacyMembershipId,
     membership.userId AS legacyUserId,
     membership.teamId AS legacyTeamId,
     team.name AS teamName,
     membership.seasonId AS legacySeasonId,
     DATE_FORMAT(season.startDate, '%Y-%m-%d') AS seasonStartsOn,
     membership.function AS legacyFunction
   FROM user_team_season membership
   JOIN team ON team.id = membership.teamId
   JOIN season ON season.id = membership.seasonId
   ORDER BY membership.id;
   ```

5. Export the MySQL result and import it into
   `legacy_team_membership_import_staging`, mapping columns by name.

6. Compare source and staging counts:

   ```sql
   -- MySQL
   SELECT count(*) FROM user_team_season;
   ```

   ```sql
   -- PostgreSQL
   SELECT count(*) FROM legacy_team_membership_import_staging;
   ```

7. Run `02-preflight.sql`. Every result set must contain zero rows. Team names
   are matched case-insensitively against the seeded PostgreSQL teams.

8. Run `02a-snapshot.sql` and export its result to:

   ```text
   /tmp/legacy-team-membership-migration/pre-migration-target-rows.csv
   ```

   Stop for approval if the snapshot would exceed 100,000 rows or 100 MB.

9. Execute `03-migrate.sql` once. It opens a transaction and intentionally
   leaves it open. In the same console, execute `04-report.sql` once.

   Do not rerun either file while that transaction remains open. If PostgreSQL
   reports `25P02` or an existing `legacy_*_before` relation, execute
   `ROLLBACK;` and restart from preflight.

10. Both integrity result sets in `04-report.sql` must contain zero failures.
    Export its row-level reports to:

    ```text
    /tmp/legacy-team-membership-migration/summary-before-after.csv
    /tmp/legacy-team-membership-migration/full-before-after.csv
    ```

11. Review several users across different seasons and roles. Execute exactly
    one of:

    ```sql
    COMMIT;
    ```

    ```sql
    ROLLBACK;
    ```

12. After application verification, run `05-cleanup.sql`. It removes staging
    data but keeps `legacy_team_migration_map` and
    `legacy_team_membership_migration_map`.

## Safety properties

- A missing migrated user, unknown function, ambiguous team name, duplicate
  assignment, or conflicting durable map aborts before inserts.
- Existing membership rows and assignment events are preserved.
- New projection rows and matching version 2 assignment events use the same
  durable membership UUID.
- The migration can be rolled back in full until the report is approved.
