-- Batch 22c — Drop redundant claim_documents table and its RLS policies
--
-- Part of M5 consolidation. Before tonight we had two tables holding
-- claim docs: claim_documents (used by /api/claim-doc + ClientDetailPage)
-- and claim_attachments (used by ClaimAttachments component + WhatsApp
-- webhook + Atlas). After 22a rewired /api/claim-doc to claim_attachments
-- and 22b deleted ClaimAttachments.tsx, nothing in code references
-- claim_documents anymore. Safe to drop.
--
-- Both tables were empty (zero rows) at the time of this migration.

-- Drop RLS policies explicitly (CASCADE would drop them anyway,
-- being explicit is clearer for future auditors)
DROP POLICY IF EXISTS "IFA deletes own claim docs" ON public.claim_documents;
DROP POLICY IF EXISTS "IFA inserts own claim docs" ON public.claim_documents;
DROP POLICY IF EXISTS "IFA reads own claim docs" ON public.claim_documents;

-- Drop the table
DROP TABLE public.claim_documents;

-- Note: the claim-documents storage bucket was not dropped via SQL
-- because Supabase's storage.protect_delete() trigger blocks direct
-- DELETE on storage.buckets. It was deleted via the Supabase dashboard
-- UI after this migration.
