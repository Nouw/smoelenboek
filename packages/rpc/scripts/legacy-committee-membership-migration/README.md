# Legacy MySQL committee membership migration

This runbook migrates `user_committee_season` rows after the legacy users have been
imported. Users are matched directly by normalized email address, so the
temporary `legacy_user_migration_map` is not required. Numeric committee and
membership IDs are retained in durable mapping tables for later migrations.

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

| Legacy function                    | New role                           |
| ---------------------------------- | ---------------------------------- |
| Commissielid                       | commissielid                       |
| Commissaris Externe Zaken          | commissaris_externe_zaken          |
| Penningmeester                     | penningmeester                     |
| Commissaris Arbitrage en Zaalwacht | commissaris_zaalwacht_en_arbitrage |
| Voorzitter                         | voorzitter                         |
| Secretaris                         | secretaris                         |

Unknown functions fail preflight. Do not guess a replacement in production.

## DataGrip workflow

1. Back up PostgreSQL and run the normal RPC migrations:

   ```bash
   pnpm --filter @repo/rpc migration:run
   ```

2. Confirm the user migration is committed and PostgreSQL user emails are
   unique when compared case-insensitively:

   ```sql
   SELECT lower(btrim(email)) AS email, count(*)
   FROM users
   WHERE email IS NOT NULL
   GROUP BY lower(btrim(email))
   HAVING count(*) > 1;
   ```

   This query must return zero rows.

3. In a PostgreSQL DataGrip console, run `01-create-staging.sql`.

4. In the old MySQL console, run:

   ```sql
   SELECT
     membership.id AS legacyMembershipId,
     membership.userId AS legacyUserId,
     legacy_user.email AS email,
     membership.committeeId AS legacyCommitteeId,
     committee.name AS committeeName,
     membership.seasonId AS legacySeasonId,
     DATE_FORMAT(season.startDate, '%Y-%m-%d') AS seasonStartsOn,
     membership.function AS legacyFunction
   FROM user_committee_season membership
   JOIN `user` legacy_user ON legacy_user.id = membership.userId
   JOIN committee ON committee.id = membership.committeeId
   JOIN season ON season.id = membership.seasonId
   ORDER BY membership.id;
   ```

5. Export the MySQL result and import it into
   `legacy_committee_membership_import_staging`, mapping columns by name.

6. Compare source and staging counts:

   ```sql
   -- MySQL
   SELECT count(*) FROM user_committee_season;
   ```

   ```sql
   -- PostgreSQL
   SELECT count(*) FROM legacy_committee_membership_import_staging;
   ```

7. Run `02-preflight.sql`. Every result set must contain zero rows. Committee names
   are matched case-insensitively against the seeded PostgreSQL committees.

8. Run `02a-snapshot.sql` and export its result to:

   ```text
   /tmp/legacy-committee-membership-migration/pre-migration-target-rows.csv
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
    /tmp/legacy-committee-membership-migration/summary-before-after.csv
    /tmp/legacy-committee-membership-migration/full-before-after.csv
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
    data but keeps `legacy_committee_migration_map` and
    `legacy_committee_membership_migration_map`.

## Safety properties

- A missing or ambiguous email match, unknown function, ambiguous committee name,
  duplicate assignment, or conflicting durable map aborts before inserts.
- Existing membership rows and assignment events are preserved.
- New projection rows and matching version 2 assignment events use the same
  durable membership UUID.
- The migration can be rolled back in full until the report is approved.
