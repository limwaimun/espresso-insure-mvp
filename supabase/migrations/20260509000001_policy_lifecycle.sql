-- Migration: B82a - Policy Lifecycle System
-- Date: 2026-05-09
-- Adds two-field state model to policies and a new lifecycle events table.
--
-- Reversible operations:
--   DROP COLUMN policies.current_phase
--   DROP COLUMN policies.policy_state
--   DROP TABLE policy_lifecycle_events
--   DROP CONSTRAINT current_phase_valid
--   DROP INDEX idx_policies_phase_state
--
-- See docs/policy-lifecycle-design.md for full design rationale.

-- ============================================================================
-- 1. Add lifecycle fields to policies table
-- ============================================================================

ALTER TABLE policies
  ADD COLUMN current_phase TEXT NOT NULL DEFAULT 'ongoing';

ALTER TABLE policies
  ADD COLUMN policy_state TEXT NOT NULL DEFAULT 'active';

-- CHECK constraint on phase enum.
-- Note: policy_state values are phase-specific (e.g. 'prospect' valid in
-- sales but not ongoing). Enforced in application layer rather than DB
-- to keep the constraint readable.
ALTER TABLE policies
  ADD CONSTRAINT current_phase_valid CHECK (
    current_phase IN ('sales', 'ongoing', 'renewal', 'claim', 'lapse_recovery')
  );

-- Index for phase-state filter queries (e.g. "all policies in renewal")
CREATE INDEX idx_policies_phase_state ON policies(current_phase, policy_state);

-- ============================================================================
-- 2. Create policy_lifecycle_events table
-- ============================================================================

CREATE TABLE policy_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  ifa_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  event_type TEXT NOT NULL CHECK (event_type IN (
    'stage_transition',
    'manual_note',
    'agent_nudge',
    'maya_drafted',
    'maya_sent'
  )),

  from_phase TEXT,
  from_state TEXT,
  to_phase TEXT,
  to_state TEXT,

  text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for per-policy timeline queries (most common: PolicyRow expanded view)
CREATE INDEX idx_lifecycle_events_policy
  ON policy_lifecycle_events(policy_id, created_at DESC);

-- Index for per-FA dashboard queries (Maya nudge feed)
CREATE INDEX idx_lifecycle_events_ifa
  ON policy_lifecycle_events(ifa_id, created_at DESC);

-- ============================================================================
-- 3. RLS for policy_lifecycle_events
-- ============================================================================

ALTER TABLE policy_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAs see own lifecycle events"
  ON policy_lifecycle_events
  FOR ALL
  USING (auth.uid() = ifa_id);
