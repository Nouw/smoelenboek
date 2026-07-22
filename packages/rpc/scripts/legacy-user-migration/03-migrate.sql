-- Keep this console open. This file intentionally leaves the transaction open.
-- Inspect 04-report.sql, export its final query to /tmp, then COMMIT or ROLLBACK.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('smoelenboek-legacy-user-migration'));
SET CONSTRAINTS ALL DEFERRED;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM legacy_user_import_staging
    WHERE "legacyUserId" IS NULL
       OR NULLIF(btrim("email"), '') IS NULL
       OR btrim("email") !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       OR NULLIF(btrim("firstName"), '') IS NULL
       OR NULLIF(btrim("lastName"), '') IS NULL
       OR NULLIF(btrim("passwordHash"), '') IS NULL
       OR "passwordHash" !~ '^\$2[aby]\$[0-9]{2}\$'
  ) THEN RAISE EXCEPTION 'Preflight failed: missing values or invalid bcrypt hash'; END IF;
  IF EXISTS (
    SELECT 1 FROM legacy_user_import_staging
    GROUP BY lower(btrim("email")) HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: duplicate email'; END IF;
  IF EXISTS (
    SELECT 1
    FROM legacy_user_import_staging s
    JOIN users u ON lower(u.email) = lower(btrim(s.email))
    GROUP BY lower(btrim(s.email)) HAVING count(u.id) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: ambiguous PostgreSQL email match'; END IF;
  IF EXISTS (
    SELECT 1 FROM legacy_user_import_staging
    GROUP BY "legacyUserId" HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: duplicate legacy id'; END IF;
  IF EXISTS (
    SELECT 1 FROM legacy_user_import_staging
    WHERE NULLIF(btrim("bondNumber"), '') IS NOT NULL
    GROUP BY btrim("bondNumber") HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Preflight failed: duplicate bond number'; END IF;
  IF EXISTS (
    SELECT 1 FROM legacy_user_import_staging
    WHERE (NULLIF(btrim("birthDate"), '') IS NOT NULL AND btrim("birthDate") !~ '^\d{4}-\d{2}-\d{2}$')
       OR (NULLIF(btrim("joinDate"), '') IS NOT NULL AND btrim("joinDate") !~ '^\d{4}-\d{2}-\d{2}$')
       OR (NULLIF(btrim("leaveDate"), '') IS NOT NULL AND btrim("leaveDate") !~ '^\d{4}-\d{2}-\d{2}$')
       OR (NULLIF(btrim("backNumber"), '') IS NOT NULL AND btrim("backNumber") !~ '^\d{1,5}$')
       OR (NULLIF(btrim("backNumber"), '') IS NOT NULL AND btrim("backNumber") ~ '^\d{1,5}$'
           AND btrim("backNumber")::integer > 32767)
  ) THEN RAISE EXCEPTION 'Preflight failed: invalid date or back number'; END IF;
  IF EXISTS (
    SELECT 1 FROM legacy_user_import_staging
    WHERE NULLIF(btrim("joinDate"), '') IS NOT NULL
      AND NULLIF(btrim("leaveDate"), '') IS NOT NULL
      AND btrim("leaveDate")::date < btrim("joinDate")::date
  ) THEN RAISE EXCEPTION 'Preflight failed: leave date precedes join date'; END IF;
  IF EXISTS (
    SELECT 1
    FROM legacy_user_import_staging s
    JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
    JOIN users u ON u.id = m."userId"
    WHERE lower(btrim(u.email)) <> lower(btrim(s.email))
  ) THEN RAISE EXCEPTION 'Preflight failed: legacy id maps to another email'; END IF;
  IF EXISTS (
    SELECT 1
    FROM legacy_user_import_staging s
    JOIN user_information i ON i."bondNumber" = NULLIF(btrim(s."bondNumber"), '')
    LEFT JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
    LEFT JOIN users email_user ON lower(email_user.email) = lower(btrim(s.email))
    WHERE COALESCE(m."userId", email_user.id) IS NULL
       OR i."userId" <> COALESCE(m."userId", email_user.id)
  ) THEN RAISE EXCEPTION 'Preflight failed: bond number belongs to another user'; END IF;
END $$;

CREATE TEMP TABLE legacy_users_before ON COMMIT DROP AS
SELECT u.* FROM users u
JOIN legacy_user_import_staging s ON lower(u.email) = lower(btrim(s."email"));
CREATE TEMP TABLE legacy_information_before ON COMMIT DROP AS
SELECT i.* FROM user_information i
JOIN legacy_users_before u ON u.id = i."userId";
CREATE TEMP TABLE legacy_accounts_before ON COMMIT DROP AS
SELECT a.* FROM account a
JOIN legacy_users_before u ON u.id = a."userId";

INSERT INTO legacy_user_migration_map ("legacyUserId", "userId")
SELECT s."legacyUserId", COALESCE(u.id, gen_random_uuid())
FROM legacy_user_import_staging s
LEFT JOIN users u ON lower(u.email) = lower(btrim(s."email"))
LEFT JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
WHERE m."legacyUserId" IS NULL;

INSERT INTO users (
  id, "authUserId", email, "emailVerified", name, "firstName", "lastName",
  role, "passwordMigrationRequired", "createdAt", "updatedAt"
)
SELECT
  m."userId", m."userId"::text, lower(btrim(s."email")), true,
  concat_ws(' ', NULLIF(btrim(s."firstName"), ''), NULLIF(btrim(s."lastName"), '')),
  NULLIF(btrim(s."firstName"), ''), NULLIF(btrim(s."lastName"), ''),
  CASE WHEN lower(btrim(s.role)) = 'admin' THEN 'admin' ELSE 'user' END,
  false, now(), now()
FROM legacy_user_import_staging s
JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
ON CONFLICT (id) DO UPDATE SET
  "authUserId" = COALESCE(users."authUserId", EXCLUDED."authUserId"),
  email = EXCLUDED.email,
  "emailVerified" = true,
  name = EXCLUDED.name,
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  role = EXCLUDED.role,
  "updatedAt" = now();

INSERT INTO user_information (
  "userId", "streetName", "houseNumber", postcode, city, "phoneNumber",
  "bankAccountNumber", "birthDate", "bondNumber", "joinDate", "leaveDate",
  "backNumber", "refereeLicense", "createdAt", "updatedAt"
)
SELECT
  m."userId", NULLIF(btrim(s."streetName"), ''), NULLIF(btrim(s."houseNumber"), ''),
  NULLIF(btrim(s.postcode), ''), NULLIF(btrim(s.city), ''),
  NULLIF(btrim(s."phoneNumber"), ''), NULLIF(btrim(s."bankAccountNumber"), ''),
  NULLIF(btrim(s."birthDate"), '')::date, NULLIF(btrim(s."bondNumber"), ''),
  NULLIF(btrim(s."joinDate"), '')::date, NULLIF(btrim(s."leaveDate"), '')::date,
  NULLIF(btrim(s."backNumber"), '')::smallint, NULLIF(btrim(s."refereeLicense"), ''),
  now(), now()
FROM legacy_user_import_staging s
JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
ON CONFLICT ("userId") DO UPDATE SET
  "streetName" = EXCLUDED."streetName",
  "houseNumber" = EXCLUDED."houseNumber",
  postcode = EXCLUDED.postcode,
  city = EXCLUDED.city,
  "phoneNumber" = EXCLUDED."phoneNumber",
  "bankAccountNumber" = EXCLUDED."bankAccountNumber",
  "birthDate" = EXCLUDED."birthDate",
  "bondNumber" = EXCLUDED."bondNumber",
  "joinDate" = EXCLUDED."joinDate",
  "leaveDate" = EXCLUDED."leaveDate",
  "backNumber" = EXCLUDED."backNumber",
  "refereeLicense" = EXCLUDED."refereeLicense",
  "updatedAt" = now();

WITH inserted_credentials AS (
  INSERT INTO account (
    id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
  )
  SELECT gen_random_uuid(), m."userId"::text, 'credential', m."userId",
         s."passwordHash", now(), now()
  FROM legacy_user_import_staging s
  JOIN legacy_user_migration_map m ON m."legacyUserId" = s."legacyUserId"
  WHERE NOT EXISTS (
    SELECT 1 FROM account a
    WHERE a."userId" = m."userId" AND a."providerId" = 'credential'
  )
  RETURNING "userId"
)
UPDATE users u
SET "passwordMigrationRequired" = true,
    "passwordMigrationResetSentAt" = NULL,
    "updatedAt" = now()
FROM inserted_credentials c
WHERE u.id = c."userId";

-- No COMMIT here. Run 04-report.sql in this same console next.
