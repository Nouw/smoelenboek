-- Export this result before running 03-migrate.sql to:
-- /tmp/legacy-user-migration/pre-migration-target-rows.csv
-- It contains personal information. Store it locally with restricted access.
SELECT
  s."legacyUserId" AS legacy_user_id,
  lower(btrim(s.email)) AS staged_email,
  u.id AS existing_user_id,
  to_jsonb(u) AS user_before,
  to_jsonb(i) AS user_information_before,
  EXISTS (
    SELECT 1 FROM account a
    WHERE a."userId" = u.id AND a."providerId" = 'credential'
  ) AS credential_existed
FROM legacy_user_import_staging s
LEFT JOIN users u ON lower(u.email) = lower(btrim(s.email))
LEFT JOIN user_information i ON i."userId" = u.id
ORDER BY s."legacyUserId";
