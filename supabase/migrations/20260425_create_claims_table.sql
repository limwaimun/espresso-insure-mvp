-- Migration: create dedicated claims table; migrate existing claim alerts.
--
-- Phase B (B57) of the claims schema redesign. Claims are currently
-- stored in the alerts table with type='claim' and the claim type
-- stuffed into the body as a [Type] prefix because alerts has no
-- dedicated column for it. This migration creates a proper claims
-- table and migrates existing rows.
--
-- Run in Supabase SQL Editor against the production database.
-- All steps wrapped in a single transaction — fail-safe rollback.

BEGIN;

-- ── Step 1: Create the claims table ────────────────────────────────────────

CREATE TABLE claims (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                uuid          NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ifa_id                   uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  policy_id                uuid          REFERENCES policies(id) ON DELETE SET NULL,

  -- Core required fields
  title                    text          NOT NULL,
  claim_type               text          NOT NULL,
  priority                 text          NOT NULL DEFAULT 'medium',
  status                   text          NOT NULL DEFAULT 'open',
  body                     text,

  -- Dates
  incident_date            date,
  filed_date               date,

  -- Amounts
  estimated_amount         numeric(12,2),
  approved_amount          numeric(12,2),
  deductible_amount        numeric(12,2),

  -- Resolution detail
  denial_reason            text,
  insurer_claim_ref        text,
  insurer_handler_name     text,
  insurer_handler_contact  text,

  -- Status timestamps (set when the row transitions to that status)
  approved_at              timestamptz,
  denied_at                timestamptz,
  paid_at                  timestamptz,
  closed_at                timestamptz,

  -- Audit
  created_at               timestamptz   NOT NULL DEFAULT now(),
  updated_at               timestamptz   NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT claim_type_valid CHECK (
    claim_type IN ('Health', 'Life', 'Critical Illness', 'Disability',
                   'Personal Accident', 'Motor', 'Travel', 'Property', 'Other')
  ),
  CONSTRAINT status_valid CHECK (
    status IN ('open', 'in_progress', 'approved', 'denied', 'paid')
  ),
  CONSTRAINT priority_valid CHECK (
    priority IN ('low', 'medium', 'high')
  )
);

COMMENT ON TABLE claims IS
  'Insurance claims against client policies. Replaces the prior pattern of storing claims in alerts with type=claim. Created in Phase B of the claims schema redesign.';

-- ── Step 2: Indexes for common query paths ────────────────────────────────

CREATE INDEX claims_client_id_idx ON claims(client_id);
CREATE INDEX claims_ifa_id_idx    ON claims(ifa_id);
CREATE INDEX claims_policy_id_idx ON claims(policy_id);
CREATE INDEX claims_status_idx    ON claims(status);

-- ── Step 3: Auto-update updated_at trigger ────────────────────────────────

CREATE OR REPLACE FUNCTION update_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claims_updated_at_trigger
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_claims_updated_at();

-- ── Step 4: Row-level security ────────────────────────────────────────────

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Users can only access their own claims (scoped by ifa_id)
CREATE POLICY claims_select_own ON claims
  FOR SELECT
  USING (ifa_id = auth.uid());

CREATE POLICY claims_insert_own ON claims
  FOR INSERT
  WITH CHECK (ifa_id = auth.uid());

CREATE POLICY claims_update_own ON claims
  FOR UPDATE
  USING (ifa_id = auth.uid())
  WITH CHECK (ifa_id = auth.uid());

CREATE POLICY claims_delete_own ON claims
  FOR DELETE
  USING (ifa_id = auth.uid());

-- ── Step 5: Migrate existing claim alerts ─────────────────────────────────
-- Parse the [Type] prefix back out of body. If absent or unrecognised,
-- fall back to 'Other'. Status mapping: resolved=true → 'paid',
-- otherwise use existing status field if it's a valid value, else 'open'.

INSERT INTO claims (
  id, client_id, ifa_id, policy_id,
  title, claim_type, priority, status, body,
  created_at, updated_at
)
SELECT
  a.id,
  a.client_id,
  a.ifa_id,
  NULL AS policy_id,
  a.title,
  COALESCE(
    NULLIF(
      CASE
        WHEN substring(a.body FROM '^\[([^\]]+)\]') IN
          ('Health', 'Life', 'Critical Illness', 'Disability',
           'Personal Accident', 'Motor', 'Travel', 'Property', 'Other')
        THEN substring(a.body FROM '^\[([^\]]+)\]')
        ELSE NULL
      END,
      ''
    ),
    'Other'
  ) AS claim_type,
  COALESCE(a.priority, 'medium') AS priority,
  CASE
    WHEN a.resolved THEN 'paid'
    WHEN a.status IN ('open', 'in_progress', 'approved', 'denied', 'paid')
      THEN a.status
    ELSE 'open'
  END AS status,
  -- Strip the [Type] prefix from body if present
  CASE
    WHEN substring(a.body FROM '^\[([^\]]+)\]') IS NOT NULL
      THEN regexp_replace(a.body, '^\[[^\]]+\]\s*', '')
    ELSE a.body
  END AS body,
  a.created_at,
  a.created_at AS updated_at
FROM alerts a
WHERE a.type = 'claim';

-- ── Step 6: Verify the migration worked before deleting alerts rows ──────
-- This INSERT should have moved exactly the same number of rows as the
-- count of claim alerts. The DO block raises an exception (rolling back
-- the whole transaction) if counts don't match.

DO $$
DECLARE
  alert_claims_count integer;
  new_claims_count   integer;
BEGIN
  SELECT count(*) INTO alert_claims_count FROM alerts WHERE type = 'claim';
  SELECT count(*) INTO new_claims_count   FROM claims;

  IF alert_claims_count != new_claims_count THEN
    RAISE EXCEPTION 'Migration count mismatch: % claim alerts, % new claims',
      alert_claims_count, new_claims_count;
  END IF;

  RAISE NOTICE 'Migration verified: % rows moved into claims table', new_claims_count;
END $$;

-- ── Step 7: Delete the migrated rows from alerts ──────────────────────────

DELETE FROM alerts WHERE type = 'claim';

COMMIT;

-- ── Post-commit sanity (run separately to verify) ─────────────────────────
--
-- SELECT count(*) FROM claims;            -- should be 4
-- SELECT count(*) FROM alerts WHERE type = 'claim';  -- should be 0
-- SELECT id, title, claim_type, status, body FROM claims LIMIT 5;
