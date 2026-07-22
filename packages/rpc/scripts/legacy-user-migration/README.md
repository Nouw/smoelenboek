# Legacy MySQL user migration

This runbook migrates the old numeric-ID MySQL users into PostgreSQL without
changing their bcrypt hashes. It also supports the literal `reset` value used
for members who never activated their old account. New and reset passwords
continue to use Better Auth's scrypt format.

## Safety properties

- Existing PostgreSQL users are matched case-insensitively by email.
- New users receive UUIDs.
- `legacy_user_migration_map` permanently maps old IDs to UUIDs for later team,
  committee, prediction, vote, and activity migrations.
- An existing Better Auth credential account is never overwritten.
- A bcrypt credential inserted by this migration sets
  `passwordMigrationRequired = true`.
- A literal `reset` credential is imported as an unusable sentinel and also
  requires migration. That member must use **Wachtwoord vergeten?** instead of
  trying to sign in with `reset`.
- A bond number containing only `-` is treated as missing and stored as `NULL`.
  This permits multiple legacy members with that placeholder while real bond
  numbers remain unique.
- The migration remains in one transaction until its report has been reviewed.
- The report excludes password hashes and high-risk personal fields.

Take a database backup before starting. Do not use a production database for a
first rehearsal.

## DataGrip workflow

1. Run the normal RPC migrations against PostgreSQL:

   ```bash
   pnpm --filter @repo/rpc migration:run
   ```

2. In a PostgreSQL DataGrip console, run `01-create-staging.sql`.

3. In the old MySQL console, run this query:

   TypeORM's old `select: false` option does not hide the password column from
   this raw SQL query or from DataGrip.

   ```sql
   SELECT
     id AS legacyUserId,
     email,
     password AS passwordHash,
     firstName,
     lastName,
     streetName,
     houseNumber,
     postcode,
     city,
     phoneNumber,
     bankaccountNumber AS bankAccountNumber,
     DATE_FORMAT(birthDate, '%Y-%m-%d') AS birthDate,
     bondNumber,
     DATE_FORMAT(joinDate, '%Y-%m-%d') AS joinDate,
     CASE WHEN leaveDate IS NULL THEN NULL
          ELSE DATE_FORMAT(leaveDate, '%Y-%m-%d') END AS leaveDate,
     backNumber,
     profilePicture,
     refereeLicense,
     role
   FROM `user`
   ORDER BY id;
   ```

4. Use DataGrip's **Export Data** on the MySQL result, then **Import Data from
   File** on `legacy_user_import_staging`. Map columns by name. A direct
   DataGrip table transfer is also fine, but explicitly map MySQL `password` to
   PostgreSQL `passwordHash` and `bankaccountNumber` to `bankAccountNumber`.

5. Compare the PostgreSQL staging count with the old MySQL count before
   changing anything:

   ```sql
   SELECT count(*) FROM legacy_user_import_staging;
   ```

   ```sql
   SELECT count(*) FROM `user`;
   ```

6. Run `02-preflight.sql`. Every result set must contain zero rows.

7. Run `02a-snapshot.sql` and export its result to
   `/tmp/legacy-user-migration/pre-migration-target-rows.csv`. This is the
   recovery baseline for rows that will be updated. It contains personal data,
   so restrict access to it. If the export would exceed 100,000 rows or 100 MB,
   stop and review the snapshot approach before continuing.

8. In one PostgreSQL console, run `03-migrate.sql`. It intentionally starts but
   does not commit a transaction. Keep that console open.

9. Run `04-report.sql` in the same console. Both integrity checks must be zero.
   Export its summary and full result sets to:

   ```text
   /tmp/legacy-user-migration/summary-before-after.csv
   /tmp/legacy-user-migration/full-before-after.csv
   ```

10. If the counts and samples are correct, run `COMMIT;`. If anything is wrong,
    run `ROLLBACK;`. Closing the connection also rolls back an uncommitted run.

11. Test one migrated bcrypt login. The old password should be accepted once, a
    reset URL should be printed by the RPC console mailer, and application APIs
    should remain blocked until that URL is used to set a new password. Also
    test one `reset` member through **Wachtwoord vergeten?**; the sentinel itself
    must never authenticate.

12. Once signed off, run `05-cleanup.sql` to delete the staging table and its
    password hashes. Keep `legacy_user_migration_map`.

## Mail provider hand-off

`src/auth/password-reset-mailer.ts` is the only delivery adapter. Replace
`createConsolePasswordResetMailer` with the real mail provider before production
use. Do not change the Better Auth reset URL or token generation.

## Media note

The old `profilePicture` value is retained only in staging for a separate object
storage migration. It is not copied into `users.imageUrl`, because the legacy
relative file path is not a valid URL in the new media system.
