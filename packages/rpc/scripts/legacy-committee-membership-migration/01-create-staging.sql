-- Run against PostgreSQL after the application migrations have completed.
CREATE TABLE IF NOT EXISTS legacy_committee_membership_import_staging (
  "legacyMembershipId" bigint,
  "legacyUserId" bigint,
  "email" text,
  "legacyCommitteeId" bigint,
  "committeeName" text,
  "legacySeasonId" bigint,
  "seasonStartsOn" date,
  "legacyFunction" text
);

ALTER TABLE legacy_committee_membership_import_staging
  ADD COLUMN IF NOT EXISTS "email" text;

CREATE TABLE IF NOT EXISTS legacy_committee_role_import_map (
  "legacyFunction" text PRIMARY KEY,
  "role" character varying NOT NULL,
  CONSTRAINT "CHK_legacy_committee_role_import_map_role" CHECK (
    "role" IN (
      'commissielid',
      'commissaris_externe_zaken',
      'wedstrijdsecretaris',
      'penningmeester',
      'commissaris_zaalwacht_en_arbitrage',
      'voorzitter',
      'secretaris'
    )
  )
);

INSERT INTO legacy_committee_role_import_map ("legacyFunction", "role")
VALUES
  ('commissielid', 'commissielid'),
  ('commissaris externe zaken', 'commissaris_externe_zaken'),
  ('penningmeester', 'penningmeester'),
  ('commissaris arbitrage en zaalwacht', 'commissaris_zaalwacht_en_arbitrage'),
  ('voorzitter', 'voorzitter'),
  ('secretaris', 'secretaris')
ON CONFLICT ("legacyFunction") DO UPDATE SET "role" = EXCLUDED."role";

TRUNCATE TABLE legacy_committee_membership_import_staging;
