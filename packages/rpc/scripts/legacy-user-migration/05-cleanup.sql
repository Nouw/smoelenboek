-- Run only after the committed migration has been checked and signed off.
-- This removes the staging copy of password hashes. The durable ID map remains.
DROP TABLE IF EXISTS legacy_user_import_staging;
