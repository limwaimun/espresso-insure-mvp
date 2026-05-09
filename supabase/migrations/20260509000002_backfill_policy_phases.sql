-- Migration: B82b - Backfill policy lifecycle phases
-- Date: 2026-05-09
--
-- Re-evaluates current_phase + policy_state for every existing policy row.
-- B82a applied DEFAULT 'ongoing'/'active' to all rows; this migration
-- corrects rows that should be in a different phase based on renewal_date.
--
-- Logic (matches lib/policies.ts renewalBucket):
--   renewal_date < NOW()                                  -> lapse_recovery/lapsed
--   renewal_date <= NOW() + 90 days                       -> renewal/upcoming
--   everything else (including renewal_date IS NULL)      -> stays ongoing/active
--
-- Reversible:
--   UPDATE policies SET current_phase='ongoing', policy_state='active';

-- ============================================================================
-- 1. Past renewal date -> lapse_recovery/lapsed
-- ============================================================================

UPDATE policies
SET current_phase = 'lapse_recovery',
    policy_state = 'lapsed'
WHERE renewal_date IS NOT NULL
  AND renewal_date < NOW();

-- ============================================================================
-- 2. Within 90 days of renewal -> renewal/upcoming
-- ============================================================================

UPDATE policies
SET current_phase = 'renewal',
    policy_state = 'upcoming'
WHERE renewal_date IS NOT NULL
  AND renewal_date >= NOW()
  AND renewal_date < NOW() + INTERVAL '90 days';

-- Note: rows with renewal_date >= NOW() + 90 days OR renewal_date IS NULL
-- stay at the B82a defaults (ongoing/active). No UPDATE needed.
