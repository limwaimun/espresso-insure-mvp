-- B85b-2: Flip the lowercase 'ifa' enum value used by messages.role to 'fa'
--
-- Code-side flip happens in the same commit. This migration handles the data
-- side. messages.role is a free-form text column (no CHECK constraint), so
-- this is a simple UPDATE.
--
-- Expected affected rows: 0 (recon at 2026-05-09 confirmed messages had no
-- role='ifa' rows). Idempotent — safe to re-run, no-op if already migrated.
--
-- The messages.metadata column doesn't exist in the current schema; if it's
-- ever restored, also run:
--   UPDATE messages SET metadata = jsonb_set(metadata, '{sender_type}', '"fa"')
--     WHERE metadata->>'sender_type' = 'ifa';

BEGIN;

UPDATE messages SET role = 'fa' WHERE role = 'ifa';

COMMIT;
