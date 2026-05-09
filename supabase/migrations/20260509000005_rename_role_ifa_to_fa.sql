-- B85f-2: profiles.role column default + value cleanup
--
-- The role column had DEFAULT 'ifa' and 140 of 141 existing profile rows
-- had value 'ifa' (1 'admin' row). Missed by the B-cleanup arc because
-- column DEFAULTS aren't in code or RLS qual clauses — only in pg_attrdef.
--
-- Manual application via Supabase SQL editor (B82a/B85b-2/B85c path).
-- Service role bypasses RLS so UPDATE runs unimpeded by the
-- self-promotion-blocked policy.

BEGIN;

-- Change column default for new rows
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'fa';

-- Update existing 'ifa' rows to 'fa'. Admin row untouched (WHERE filter).
UPDATE profiles SET role = 'fa' WHERE role = 'ifa';

COMMIT;
