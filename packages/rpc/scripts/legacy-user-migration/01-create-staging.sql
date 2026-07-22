-- Run against PostgreSQL after the application migrations have completed.
-- This table contains password hashes. Restrict access and drop it after sign-off.
CREATE TABLE IF NOT EXISTS legacy_user_import_staging (
  "legacyUserId" bigint,
  "email" text,
  "passwordHash" text,
  "firstName" text,
  "lastName" text,
  "streetName" text,
  "houseNumber" text,
  "postcode" text,
  "city" text,
  "phoneNumber" text,
  "bankAccountNumber" text,
  "birthDate" text,
  "bondNumber" text,
  "joinDate" text,
  "leaveDate" text,
  "backNumber" text,
  "profilePicture" text,
  "refereeLicense" text,
  "role" text
);

TRUNCATE TABLE legacy_user_import_staging;
