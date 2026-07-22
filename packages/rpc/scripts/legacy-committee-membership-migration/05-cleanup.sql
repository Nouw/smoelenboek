-- Run only after the committed migration has been checked and signed off.
-- The durable committee and membership ID maps remain for later migrations.
DROP TABLE IF EXISTS legacy_committee_role_import_map;
DROP TABLE IF EXISTS legacy_committee_membership_import_staging;
