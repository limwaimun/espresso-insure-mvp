-- BATCH B-pe-3: Add schema_version column to policies
--
-- Forward-compat for the parsed_summary jsonb shape. When we evolve
-- the brief schema in future batches, we mark old briefs stale by
-- detecting (parse_schema_version != current).
--
-- Reversible: rollback at bottom (commented).

BEGIN;

ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS parse_schema_version int;

COMMENT ON COLUMN policies.parse_schema_version IS
  'Version of the ParsedPolicySummary schema used at parse time. Increment when fields are added/removed. Used to mark briefs stale and trigger re-parse on schema evolution.';

CREATE INDEX IF NOT EXISTS policies_parse_schema_version_idx
  ON policies(parse_schema_version, parse_status)
  WHERE parsed_summary IS NOT NULL;

COMMIT;

-- ROLLBACK (DO NOT RUN UNLESS REVERTING)
-- BEGIN;
-- DROP INDEX IF EXISTS policies_parse_schema_version_idx;
-- ALTER TABLE policies DROP COLUMN IF EXISTS parse_schema_version;
-- COMMIT;
