/**
 * Shared types for the tiered policy extraction subsystem.
 *
 * Layer A: Brief — structured + narrative summary on policies
 * Layer B: Sections — canonical section index per policy
 * Layer C: Chunks — voyage-3.5-lite embeddings for RAG
 * Layer D: Tier router + extraction log
 *
 * Stays minimal in B-pe-2; expands in B-pe-3 (brief schema) and beyond.
 */

// =============================================================================
// Layer A — Brief
// =============================================================================

/**
 * Status of a policy's parse pipeline.
 *
 * Lifecycle:
 *   pending  → parsing → done (happy path)
 *   pending  → parsing → failed (transient errors, retried)
 *   done     → stale (when model is upgraded; flagged for re-parse)
 */
export type PolicyParseStatus =
  | 'pending'
  | 'parsing'
  | 'done'
  | 'failed'
  | 'stale';

// Note: ParsedPolicySummary will be locked in B-pe-3 once we finalize the
// brief schema. Placeholder here so dependent code has an import target.
export interface ParsedPolicySummary {
  // Locked in B-pe-3
  [key: string]: unknown;
}

// =============================================================================
// Layer B — Sections
// =============================================================================

/**
 * Canonical section taxonomy. Mirrors the CHECK constraint on
 * policy_sections.section_kind.
 *
 * Add new kinds here AND in the migration before using.
 */
export type PolicySectionKind =
  | 'schedule'
  | 'definitions'
  | 'summary'
  | 'benefits'
  | 'surgical_schedule'
  | 'exclusions'
  | 'premiums'
  | 'claims'
  | 'conditions'
  | 'free_look'
  | 'termination'
  | 'signatures'
  | 'cover'
  | 'welcome'
  | 'toc'
  | 'other';

export interface PolicySection {
  id: string;
  policyId: string;
  faId: string;
  sectionKind: PolicySectionKind;
  sectionLabel: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  textContent: string | null;
  tokenCount: number | null;
  createdAt: string;
}

// =============================================================================
// Layer C — Chunks
// =============================================================================

export interface PolicyDocChunk {
  id: string;
  policyId: string;
  faId: string;
  sectionId: string | null;
  pageNumber: number | null;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  embedding: number[]; // length 1024 for voyage-3.5-lite
  embeddingModel: string;
  createdAt: string;
}

// =============================================================================
// Layer D — Tier router + extraction log
// =============================================================================

export type ExtractionTier = 'brief' | 'section' | 'rag' | 'full';

export interface TierRouterDecision {
  tier: ExtractionTier;
  context: string;
  retrievedSectionKinds?: PolicySectionKind[];
  retrievedChunkIds?: string[];
  classifierTokens?: { input: number; output: number };
}

export interface ExtractionLogEntry {
  policyId: string;
  faId: string | null;
  agentName: string;
  querySummary: string | null;
  tierUsed: ExtractionTier;
  tierResolved: boolean;
  retrievedSectionKinds?: PolicySectionKind[];
  retrievedChunkIds?: string[];
  classifierInputTokens?: number;
  classifierOutputTokens?: number;
  agentInputTokens?: number;
  agentOutputTokens?: number;
  costUsd?: number;
  latencyMs?: number;
}
