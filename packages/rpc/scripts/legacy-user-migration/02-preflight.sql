-- Every query below must return zero rows before 03-migrate.sql is run.

-- Missing required values or hashes that are not legacy bcrypt.
SELECT "legacyUserId", "email", 'missing/invalid required value' AS issue
FROM legacy_user_import_staging
WHERE "legacyUserId" IS NULL
   OR NULLIF(btrim("email"), '') IS NULL
   OR btrim("email") !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
   OR NULLIF(btrim("firstName"), '') IS NULL
   OR NULLIF(btrim("lastName"), '') IS NULL
   OR NULLIF(btrim("passwordHash"), '') IS NULL
   OR (
     btrim("passwordHash") <> 'reset'
     AND "passwordHash" !~ '^\$2[aby]\$[0-9]{2}\$'
   );

-- Duplicate identities in the export.
SELECT lower(btrim("email")) AS value, count(*) AS occurrences, 'duplicate email' AS issue
FROM legacy_user_import_staging
GROUP BY lower(btrim("email"))
HAVING count(*) > 1;

SELECT lower(btrim(s.email)) AS value, count(u.id) AS occurrences,
       'multiple PostgreSQL users match this email' AS issue
FROM legacy_user_import_staging s
JOIN users u ON lower(u.email) = lower(btrim(s.email))
GROUP BY lower(btrim(s.email))
HAVING count(u.id) > 1;

SELECT "legacyUserId" AS value, count(*) AS occurrences, 'duplicate legacy id' AS issue
FROM legacy_user_import_staging
GROUP BY "legacyUserId"
HAVING count(*) > 1;

SELECT btrim("bondNumber") AS value, count(*) AS occurrences, 'duplicate bond number' AS issue
FROM legacy_user_import_staging
WHERE NULLIF(btrim("bondNumber"), '') IS NOT NULL
GROUP BY btrim("bondNumber")
HAVING count(*) > 1;

-- Values that cannot be converted into the PostgreSQL target types.
SELECT "legacyUserId", "email", 'invalid date/back number' AS issue
FROM legacy_user_import_staging
WHERE (NULLIF(btrim("birthDate"), '') IS NOT NULL AND btrim("birthDate") !~ '^\d{4}-\d{2}-\d{2}$')
   OR (NULLIF(btrim("joinDate"), '') IS NOT NULL AND btrim("joinDate") !~ '^\d{4}-\d{2}-\d{2}$')
   OR (NULLIF(btrim("leaveDate"), '') IS NOT NULL AND btrim("leaveDate") !~ '^\d{4}-\d{2}-\d{2}$')
   OR (NULLIF(btrim("backNumber"), '') IS NOT NULL AND btrim("backNumber") !~ '^\d{1,5}$')
   OR (NULLIF(btrim("backNumber"), '') IS NOT NULL AND btrim("backNumber") ~ '^\d{1,5}$'
       AND btrim("backNumber")::integer > 32767);

-- A previous map may only point at the user with the same normalized email.
SELECT s."legacyUserId", s."email", m."userId", u."email" AS mapped_email,
       'legacy id is already mapped to another email' AS issue
FROM legacy_user_import_staging s
JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
JOIN users u ON u.id = m."userId"
WHERE lower(btrim(u.email)) <> lower(btrim(s."email"));

-- Prevent a bond number from being moved from a different member.
SELECT s."legacyUserId", s."email", s."bondNumber", i."userId",
       'bond number belongs to another user' AS issue
FROM legacy_user_import_staging s
JOIN user_information i ON i."bondNumber" = NULLIF(btrim(s."bondNumber"), '')
LEFT JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
LEFT JOIN users email_user ON lower(email_user.email) = lower(btrim(s."email"))
WHERE COALESCE(m."userId", email_user.id) IS NULL
   OR i."userId" <> COALESCE(m."userId", email_user.id);
