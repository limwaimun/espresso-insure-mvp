-- B85c: Rename ifa_id columns to fa_id across 14 tables, plus index/constraint/
-- policy name cleanups for consistency.
--
-- Dry run on lens_cache (2026-05-09) confirmed Postgres auto-updates RLS qual
-- clauses on column rename. So we only rename policy NAMES (not drop+recreate),
-- and only those containing "IFA" or "IFAs". Index DEFINITIONS auto-update too;
-- only their NAMES need cleanup.
--
-- ~65 statements. Atomic transaction.
-- Manual application via Supabase SQL editor (B82a/B85b-2 path).

BEGIN;

-- ============================================================================
-- STEP 1: COLUMN RENAMES (14 tables)
-- ============================================================================
ALTER TABLE alerts RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE claim_attachments RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE claim_status_events RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE claims RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE clients RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE conversations RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE fa_daily_spend RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE holding_documents RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE holdings RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE lens_cache RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE policies RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE policy_documents RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE policy_lifecycle_events RENAME COLUMN ifa_id TO fa_id;
ALTER TABLE webhook_rate_limits RENAME COLUMN ifa_id TO fa_id;

-- ============================================================================
-- STEP 2: INDEX RENAMES (15)
-- The 2 "_key" indexes back UNIQUE constraints; renaming the index also
-- renames the underlying constraint (they share names in Postgres).
-- ============================================================================
ALTER INDEX idx_alerts_ifa RENAME TO idx_alerts_fa;
ALTER INDEX claim_attachments_ifa_id_idx RENAME TO claim_attachments_fa_id_idx;
ALTER INDEX claim_status_events_ifa_idx RENAME TO claim_status_events_fa_idx;
ALTER INDEX claims_ifa_id_idx RENAME TO claims_fa_id_idx;
ALTER INDEX idx_clients_ifa RENAME TO idx_clients_fa;
ALTER INDEX idx_conversations_ifa RENAME TO idx_conversations_fa;
ALTER INDEX fa_daily_spend_ifa_date_idx RENAME TO fa_daily_spend_fa_date_idx;
ALTER INDEX fa_daily_spend_ifa_id_date_key RENAME TO fa_daily_spend_fa_id_date_key;
ALTER INDEX holding_documents_ifa_id_idx RENAME TO holding_documents_fa_id_idx;
ALTER INDEX holdings_ifa_id_idx RENAME TO holdings_fa_id_idx;
ALTER INDEX lens_cache_ifa_id_idx RENAME TO lens_cache_fa_id_idx;
ALTER INDEX lens_cache_ifa_id_key RENAME TO lens_cache_fa_id_key;
ALTER INDEX idx_policies_ifa RENAME TO idx_policies_fa;
ALTER INDEX policy_documents_ifa_id_idx RENAME TO policy_documents_fa_id_idx;
ALTER INDEX idx_lifecycle_events_ifa RENAME TO idx_lifecycle_events_fa;

-- ============================================================================
-- STEP 3: FK CONSTRAINT RENAMES (14)
-- ============================================================================
ALTER TABLE alerts RENAME CONSTRAINT alerts_ifa_id_fkey TO alerts_fa_id_fkey;
ALTER TABLE claim_attachments RENAME CONSTRAINT claim_attachments_ifa_id_fkey TO claim_attachments_fa_id_fkey;
ALTER TABLE claim_status_events RENAME CONSTRAINT claim_status_events_ifa_id_fkey TO claim_status_events_fa_id_fkey;
ALTER TABLE claims RENAME CONSTRAINT claims_ifa_id_fkey TO claims_fa_id_fkey;
ALTER TABLE clients RENAME CONSTRAINT clients_ifa_id_fkey TO clients_fa_id_fkey;
ALTER TABLE conversations RENAME CONSTRAINT conversations_ifa_id_fkey TO conversations_fa_id_fkey;
ALTER TABLE fa_daily_spend RENAME CONSTRAINT fa_daily_spend_ifa_id_fkey TO fa_daily_spend_fa_id_fkey;
ALTER TABLE holding_documents RENAME CONSTRAINT holding_documents_ifa_id_fkey TO holding_documents_fa_id_fkey;
ALTER TABLE holdings RENAME CONSTRAINT holdings_ifa_id_fkey TO holdings_fa_id_fkey;
ALTER TABLE lens_cache RENAME CONSTRAINT lens_cache_ifa_id_fkey TO lens_cache_fa_id_fkey;
ALTER TABLE policies RENAME CONSTRAINT policies_ifa_id_fkey TO policies_fa_id_fkey;
ALTER TABLE policy_documents RENAME CONSTRAINT policy_documents_ifa_id_fkey TO policy_documents_fa_id_fkey;
ALTER TABLE policy_lifecycle_events RENAME CONSTRAINT policy_lifecycle_events_ifa_id_fkey TO policy_lifecycle_events_fa_id_fkey;
ALTER TABLE webhook_rate_limits RENAME CONSTRAINT webhook_rate_limits_ifa_id_fkey TO webhook_rate_limits_fa_id_fkey;

-- ============================================================================
-- STEP 4: RLS POLICY NAME RENAMES (22)
-- Note: qual clauses auto-update from column rename (verified by dry run).
-- ============================================================================
ALTER POLICY "IFAs can insert own alerts" ON alerts RENAME TO "FAs can insert own alerts";
ALTER POLICY "IFAs can read own alerts" ON alerts RENAME TO "FAs can read own alerts";
ALTER POLICY "IFAs can update own alerts" ON alerts RENAME TO "FAs can update own alerts";
ALTER POLICY "IFAs can delete own clients" ON clients RENAME TO "FAs can delete own clients";
ALTER POLICY "IFAs can insert own clients" ON clients RENAME TO "FAs can insert own clients";
ALTER POLICY "IFAs can read own clients" ON clients RENAME TO "FAs can read own clients";
ALTER POLICY "IFAs can update own clients" ON clients RENAME TO "FAs can update own clients";
ALTER POLICY "IFAs can insert own conversations" ON conversations RENAME TO "FAs can insert own conversations";
ALTER POLICY "IFAs can read own conversations" ON conversations RENAME TO "FAs can read own conversations";
ALTER POLICY "IFAs can update own conversations" ON conversations RENAME TO "FAs can update own conversations";
ALTER POLICY "IFA deletes own holding docs" ON holding_documents RENAME TO "FA deletes own holding docs";
ALTER POLICY "IFA inserts own holding docs" ON holding_documents RENAME TO "FA inserts own holding docs";
ALTER POLICY "IFA reads own holding docs" ON holding_documents RENAME TO "FA reads own holding docs";
ALTER POLICY "IFAs can insert messages in own conversations" ON messages RENAME TO "FAs can insert messages in own conversations";
ALTER POLICY "IFAs can read messages in own conversations" ON messages RENAME TO "FAs can read messages in own conversations";
ALTER POLICY "IFAs can delete own policies" ON policies RENAME TO "FAs can delete own policies";
ALTER POLICY "IFAs can insert own policies" ON policies RENAME TO "FAs can insert own policies";
ALTER POLICY "IFAs can read own policies" ON policies RENAME TO "FAs can read own policies";
ALTER POLICY "IFAs can update own policies" ON policies RENAME TO "FAs can update own policies";
ALTER POLICY "IFA deletes own policy docs" ON policy_documents RENAME TO "FA deletes own policy docs";
ALTER POLICY "IFA inserts own policy docs" ON policy_documents RENAME TO "FA inserts own policy docs";
ALTER POLICY "IFA reads own policy docs" ON policy_documents RENAME TO "FA reads own policy docs";

COMMIT;
