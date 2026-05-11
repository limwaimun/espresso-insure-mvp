-- B-pe-18a — Per-layer parse status columns.
--
-- Adds tracking columns for Layer B (sections) and Layer C (chunks).
-- Layer A continues to use the existing `parse_status` column.
--
-- Status vocabulary: pending / running / done / failed / skipped.
-- Differs from legacy parse_status ('parsing' instead of 'running')
-- intentionally — the API layer normalises both to a unified shape
-- before returning to the UI.

ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS sections_status        text NOT NULL DEFAULT 'pending'
    CHECK (sections_status IN ('pending','running','done','failed','skipped')),
  ADD COLUMN IF NOT EXISTS sections_started_at    timestamptz,
  ADD COLUMN IF NOT EXISTS sections_completed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS sections_error         text,
  ADD COLUMN IF NOT EXISTS chunks_status          text NOT NULL DEFAULT 'pending'
    CHECK (chunks_status IN ('pending','running','done','failed','skipped')),
  ADD COLUMN IF NOT EXISTS chunks_started_at      timestamptz,
  ADD COLUMN IF NOT EXISTS chunks_completed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS chunks_error           text;

-- Backfill from existing data.
-- Any policy with section/chunk rows is marked done. Policies with
-- no rows stay 'pending' (matches reality — those never finished
-- or never started those layers).

UPDATE policies p
SET sections_status       = 'done',
    sections_completed_at = COALESCE(parsed_at, NOW())
WHERE sections_status = 'pending'
  AND EXISTS (SELECT 1 FROM policy_sections ps WHERE ps.policy_id = p.id);

UPDATE policies p
SET chunks_status       = 'done',
    chunks_completed_at = COALESCE(parsed_at, NOW())
WHERE chunks_status = 'pending'
  AND EXISTS (SELECT 1 FROM policy_doc_chunks pc WHERE pc.policy_id = p.id);

COMMENT ON COLUMN policies.sections_status       IS 'Layer B (section index) state: pending / running / done / failed / skipped.';
COMMENT ON COLUMN policies.sections_started_at   IS 'When Layer B parse most recently started.';
COMMENT ON COLUMN policies.sections_completed_at IS 'When Layer B parse most recently finished (done or failed).';
COMMENT ON COLUMN policies.sections_error        IS 'Last error message from Layer B parse, if failed.';
COMMENT ON COLUMN policies.chunks_status         IS 'Layer C (chunks + embeddings) state: pending / running / done / failed / skipped.';
COMMENT ON COLUMN policies.chunks_started_at     IS 'When Layer C parse most recently started.';
COMMENT ON COLUMN policies.chunks_completed_at   IS 'When Layer C parse most recently finished (done or failed).';
COMMENT ON COLUMN policies.chunks_error          IS 'Last error message from Layer C parse, if failed.';

-- Rollback (manual, commented out):
--
-- ALTER TABLE policies
--   DROP COLUMN IF EXISTS sections_status,
--   DROP COLUMN IF EXISTS sections_started_at,
--   DROP COLUMN IF EXISTS sections_completed_at,
--   DROP COLUMN IF EXISTS sections_error,
--   DROP COLUMN IF EXISTS chunks_status,
--   DROP COLUMN IF EXISTS chunks_started_at,
--   DROP COLUMN IF EXISTS chunks_completed_at,
--   DROP COLUMN IF EXISTS chunks_error;
