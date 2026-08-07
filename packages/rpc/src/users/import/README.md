# User import

The admin UI accepts `.xlsx` files up to 5 MB and 1,000 non-empty data rows.
It previews a selected worksheet and header row, suggests Dutch/English header
mappings, validates normalized rows, and hashes the workbook. Execution reparses
the file and rejects it when its SHA-256 hash differs from the preview.

Required mappings are `email` and one of `name`, `firstName`, or `lastName`.
Importable fields are defined by `IMPORT_FIELDS`; privileged account fields are
not exposed. Typed Excel dates, `YYYY-MM-DD`, and `DD-MM-YYYY` are accepted.
Missing language values default to Dutch. Existing or in-workbook email/bond
number conflicts are skipped and included in the downloadable result CSV.

Every created row uses the same provisioning saga as manual creation and queues
one invitation. A failure on one row does not roll back successful rows.
