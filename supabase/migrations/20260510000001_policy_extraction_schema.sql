-- BATCH B-pe-1: Tiered policy extraction schema
--
-- Layer A: Brief — structured + narrative summary on policies
-- Layer B: Sections — canonical section index per policy
-- Layer C: Chunks — voyage-context-3 embeddings for RAG
-- Layer D: Extraction log — tier routing + cost telemetry
--
-- Reversible: rollback block at bottom (commented).
-- All FK references use fa_id (post B85c rename, NOT ifa_id).

BEGIN;

-- ===========================================================================
-- 0. Extensions
-- ===========================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ===========================================================================
-- 1. Layer A — Brief columns on policies
-- ===========================================================================
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS parsed_summary       jsonb,
  ADD COLUMN IF NOT EXISTS parsed_brief         text,
  ADD COLUMN IF NOT EXISTS parse_status         text NOT NULL DEFAULT 'pending'
    CHECK (parse_status IN ('pending','parsing','done','failed','stale')),
  ADD COLUMN IF NOT EXISTS parsed_at            timestamptz,
  ADD COLUMN IF NOT EXISTS parse_input_tokens   int,
  ADD COLUMN IF NOT EXISTS parse_output_tokens  int,
  ADD COLUMN IF NOT EXISTS parse_cost_usd       numeric(10,6),
  ADD COLUMN IF NOT EXISTS parse_model          text,
  ADD COLUMN IF NOT EXISTS parse_attempt_count  int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parse_last_error     text,
  ADD COLUMN IF NOT EXISTS parse_doc_hash       text;

-- Partial index — only rows that need work
CREATE INDEX IF NOT EXISTS policies_parse_status_pending_idx
  ON policies (parse_status, fa_id)
  WHERE parse_status IN ('pending','failed','stale');

COMMENT ON COLUMN policies.parsed_summary    IS 'Structured field extraction from policy PDF (canonical schema). Layer A.';
COMMENT ON COLUMN policies.parsed_brief      IS 'Markdown narrative brief (~500-1500 tokens) for cheap agent consumption. Layer A.';
COMMENT ON COLUMN policies.parse_status      IS 'pending / parsing / done / failed / stale (when model upgrades).';
COMMENT ON COLUMN policies.parse_doc_hash    IS 'SHA256 of source PDF; prevents re-parse on identical re-upload.';
COMMENT ON COLUMN policies.parse_model       IS 'Model identifier used for parse (e.g., claude-sonnet-4-6). Enables re-parse on upgrades.';

-- ===========================================================================
-- 2. Layer B — Sections table
-- ===========================================================================
CREATE TABLE IF NOT EXISTS policy_sections (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id       uuid        NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  fa_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_kind    text        NOT NULL
    CHECK (section_kind IN (
      'schedule','definitions','summary','benefits','surgical_schedule',
      'exclusions','premiums','claims','conditions','free_look',
      'termination','signatures','cover','welcome','toc','other'
    )),
  section_label   text,
  page_start      int,
  page_end        int,
  text_content    text,
  token_count     int,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_sections_policy_idx ON policy_sections(policy_id);
CREATE INDEX IF NOT EXISTS policy_sections_kind_idx   ON policy_sections(policy_id, section_kind);

ALTER TABLE policy_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_sections_fa_select ON policy_sections
  FOR SELECT USING (
    fa_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY policy_sections_service_all ON policy_sections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE policy_sections IS 'Layer B — section index per policy for targeted retrieval.';

-- ===========================================================================
-- 3. Layer C — Vector chunks table (voyage-context-3, dim 1024)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS policy_doc_chunks (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id        uuid          NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  fa_id            uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id       uuid          REFERENCES policy_sections(id) ON DELETE SET NULL,
  page_number      int,
  chunk_index      int           NOT NULL,
  content          text          NOT NULL,
  token_count      int,
  embedding        vector(1024),
  embedding_model  text          NOT NULL DEFAULT 'voyage-context-3',
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_doc_chunks_policy_idx ON policy_doc_chunks(policy_id);

-- HNSW index for cosine ANN search. Tunables (m=16, ef_construction=64) are
-- pgvector defaults; revisit when chunk count > 100k.
CREATE INDEX IF NOT EXISTS policy_doc_chunks_embedding_hnsw
  ON policy_doc_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE policy_doc_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_doc_chunks_fa_select ON policy_doc_chunks
  FOR SELECT USING (
    fa_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY policy_doc_chunks_service_all ON policy_doc_chunks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE policy_doc_chunks IS 'Layer C — voyage-context-3 chunk embeddings for RAG retrieval.';

-- ===========================================================================
-- 4. Layer D — Extraction log (tier routing + cost telemetry)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS policy_extraction_log (
  id                         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id                  uuid          NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  fa_id                      uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  agent_name                 text          NOT NULL,
  query_summary              text,
  tier_used                  text          NOT NULL CHECK (tier_used IN ('brief','section','rag','full')),
  tier_resolved              boolean       NOT NULL DEFAULT true,
  retrieved_section_kinds    text[],
  retrieved_chunk_ids        uuid[],
  classifier_input_tokens    int,
  classifier_output_tokens   int,
  agent_input_tokens         int,
  agent_output_tokens        int,
  cost_usd                   numeric(10,6),
  latency_ms                 int,
  created_at                 timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_extraction_log_policy_idx
  ON policy_extraction_log(policy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS policy_extraction_log_tier_idx
  ON policy_extraction_log(tier_used, tier_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS policy_extraction_log_agent_idx
  ON policy_extraction_log(agent_name, created_at DESC);

ALTER TABLE policy_extraction_log ENABLE ROW LEVEL SECURITY;

-- Admin-only read; service-role full access for logging from agent routes
CREATE POLICY policy_extraction_log_admin_select ON policy_extraction_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY policy_extraction_log_service_all ON policy_extraction_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE policy_extraction_log IS 'Layer D — per-query telemetry: which tier resolved, cost, latency. Drives admin dashboards + tier router accuracy tuning.';

COMMIT;

-- ===========================================================================
-- ROLLBACK (DO NOT RUN UNLESS REVERTING THIS BATCH)
-- ===========================================================================
-- BEGIN;
-- DROP TABLE IF EXISTS policy_extraction_log;
-- DROP TABLE IF EXISTS policy_doc_chunks;
-- DROP TABLE IF EXISTS policy_sections;
-- DROP INDEX IF EXISTS policies_parse_status_pending_idx;
-- ALTER TABLE policies
--   DROP COLUMN IF EXISTS parse_doc_hash,
--   DROP COLUMN IF EXISTS parse_last_error,
--   DROP COLUMN IF EXISTS parse_attempt_count,
--   DROP COLUMN IF EXISTS parse_model,
--   DROP COLUMN IF EXISTS parse_cost_usd,
--   DROP COLUMN IF EXISTS parse_output_tokens,
--   DROP COLUMN IF EXISTS parse_input_tokens,
--   DROP COLUMN IF EXISTS parsed_at,
--   DROP COLUMN IF EXISTS parse_status,
--   DROP COLUMN IF EXISTS parsed_brief,
--   DROP COLUMN IF EXISTS parsed_summary;
-- COMMIT;
