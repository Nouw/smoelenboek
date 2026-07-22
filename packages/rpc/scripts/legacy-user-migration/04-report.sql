-- Run in the same console while 03-migrate.sql is still open.
SELECT
  count(*) AS staged_users,
  count(*) FILTER (WHERE b.id IS NULL) AS users_created,
  count(*) FILTER (WHERE b.id IS NOT NULL) AS users_matched_by_email,
  count(*) FILTER (WHERE a.id IS NULL) AS credential_accounts_created,
  count(*) FILTER (WHERE a.id IS NOT NULL) AS existing_credentials_preserved
FROM legacy_user_import_staging s
JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
LEFT JOIN legacy_users_before b ON b.id = m."userId"
LEFT JOIN legacy_accounts_before a
  ON a."userId" = m."userId" AND a."providerId" = 'credential';

-- Every count must be zero.
SELECT
  count(*) FILTER (WHERE u.id IS NULL) AS missing_users,
  count(*) FILTER (WHERE i."userId" IS NULL) AS missing_information,
  count(*) FILTER (WHERE a.id IS NULL) AS missing_credentials,
  count(*) FILTER (
    WHERE a.id IS NOT NULL
      AND a.password IS DISTINCT FROM
        CASE WHEN btrim(s."passwordHash") = 'reset'
             THEN 'reset' ELSE s."passwordHash" END
      AND old_a.id IS NULL
  ) AS changed_imported_hashes,
  count(*) FILTER (
    WHERE old_a.id IS NOT NULL AND a.password IS DISTINCT FROM old_a.password
  ) AS overwritten_modern_credentials
FROM legacy_user_import_staging s
JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
LEFT JOIN users u ON u.id = m."userId"
LEFT JOIN user_information i ON i."userId" = m."userId"
LEFT JOIN account a ON a."userId" = m."userId" AND a."providerId" = 'credential'
LEFT JOIN legacy_accounts_before old_a
  ON old_a."userId" = m."userId" AND old_a."providerId" = 'credential';

-- Export this result from DataGrip as
-- /tmp/legacy-user-migration/summary-before-after.csv.
-- It deliberately excludes password hashes, bank accounts, phone numbers, and addresses.
SELECT
  s."legacyUserId" AS legacy_user_id,
  m."userId" AS new_user_id,
  lower(btrim(s.email)) AS email,
  CASE WHEN b.id IS NULL THEN 'created' ELSE 'matched' END AS user_action,
  CASE
    WHEN old_a.id IS NOT NULL THEN 'existing_credential_preserved'
    WHEN btrim(s."passwordHash") = 'reset' THEN 'reset_required'
    ELSE 'legacy_bcrypt_inserted'
  END AS credential_action,
  u."passwordMigrationRequired" AS reset_required,
  u.role,
  i."joinDate" AS join_date,
  i."leaveDate" AS leave_date
FROM legacy_user_import_staging s
JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
JOIN users u ON u.id = m."userId"
JOIN user_information i ON i."userId" = m."userId"
LEFT JOIN legacy_users_before b ON b.id = m."userId"
LEFT JOIN legacy_accounts_before old_a
  ON old_a."userId" = m."userId" AND old_a."providerId" = 'credential'
ORDER BY s."legacyUserId";

-- Export this full row-level diff as
-- /tmp/legacy-user-migration/full-before-after.csv.
-- It contains personal information. Store it locally with restricted access.
SELECT
  s."legacyUserId" AS legacy_user_id,
  m."userId" AS new_user_id,
  to_jsonb(before_u) AS user_before,
  to_jsonb(u) AS user_after,
  to_jsonb(before_i) AS user_information_before,
  to_jsonb(i) AS user_information_after,
  CASE WHEN old_a.id IS NULL THEN false ELSE true END AS credential_existed,
  CASE WHEN old_a.id IS NULL THEN 'inserted' ELSE 'preserved' END AS credential_action
FROM legacy_user_import_staging s
JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
JOIN users u ON u.id = m."userId"
JOIN user_information i ON i."userId" = m."userId"
LEFT JOIN legacy_users_before before_u ON before_u.id = m."userId"
LEFT JOIN legacy_information_before before_i ON before_i."userId" = m."userId"
LEFT JOIN legacy_accounts_before old_a
  ON old_a."userId" = m."userId" AND old_a."providerId" = 'credential'
ORDER BY s."legacyUserId";

-- After reviewing/exporting: execute exactly one of these manually.
-- COMMIT;
-- ROLLBACK;
