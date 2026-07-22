-- Run only after the committed migration has been checked and signed off.
-- The durable team and membership ID maps remain for later migrations.
DROP TABLE IF EXISTS legacy_team_role_import_map;
DROP TABLE IF EXISTS legacy_team_membership_import_staging;
