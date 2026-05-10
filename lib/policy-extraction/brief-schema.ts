/**
 * Policy brief schema — v1.
 *
 * This is the structured representation of a policy that gets stored in
 * policies.parsed_summary (jsonb). Maya, Compass, Lens consume this as
 * their cheap-tier context.
 *
 * Schema versioning:
 *   v1 (this) — initial Path-1 schema. Will be wrong in some ways; we
 *               iterate from real FA usage data in Layer D logs.
 *
 * When evolving:
 *   1. Bump SCHEMA_VERSION below
 *   2. Update zod schema with new/changed fields
 *   3. Update Claude tool definition in parse-brief.ts to match
 *   4. Existing rows with older parse_schema_version get marked stale
 *      and re-parsed by the background job (B-pe-15)
 */

import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';

export const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const RegulatoryTypeSchema = z.enum([
  'is_plan',         // Integrated Shield (e.g. AIA HealthShield, Income IncomeShield)
  'term_life',       // Pure protection, no cash value
  'whole_life',      // Participating, builds cash value
  'ilp',             // Investment-Linked Plan
  'critical_illness',// CI (multi-stage or simple)
  'endowment',       // Savings + protection
  'group_health',    // SME / corporate group plans
  'personal_accident',
  'disability',
  'other',
]);

export const PolicyStatusSchema = z.enum([
  'in_force',
  'paid_up',         // Premium cessation reached, cover continues
  'lapsed',
  'surrendered',
  'terminated',
  'unknown',
]);

export const PremiumFrequencySchema = z.enum([
  'annual',
  'semi_annual',
  'quarterly',
  'monthly',
  'single_premium',
  'unknown',
]);

export const NominationTypeSchema = z.enum([
  'trust_nomination',     // Irrevocable, governed by Insurance Act
  'revocable_nomination',
  'beneficiary_clause',   // Older policies, pre-nomination framework
  'none_specified',
  'unknown',
]);

export const BeneficiarySchema = z.object({
  name: z.string(),
  relationship: z.string().nullable(),
  share_percent: z.number().nullable(),
});

export const RiderSchema = z.object({
  name: z.string(),
  annual_premium: z.number().nullable(),
  effect_summary: z.string().nullable(),
});

export const CIStageCoverageSchema = z.object({
  early_stage: z.boolean(),
  intermediate_stage: z.boolean(),
  severe_stage: z.boolean(),
  total_conditions_covered: z.number().nullable(),
});

// ---------------------------------------------------------------------------
// Main schema — v1
// ---------------------------------------------------------------------------

export const ParsedPolicySummaryV1Schema = z.object({
  // ===== Identification =====
  policyholder_name: z.string().nullable(),
  insured_person_name: z.string().nullable(),
  nric_masked: z.string().nullable(),
  date_of_birth: z.string().nullable(), // ISO date string YYYY-MM-DD where extractable
  policy_number: z.string().nullable(),
  plan_name: z.string().nullable(),
  plan_tier: z.string().nullable(), // e.g. "Plan A", "Standard", "Preferred"

  // ===== Insurer =====
  insurer_name: z.string().nullable(),
  product_family: z.string().nullable(), // e.g. "HealthShield Gold Max", "PRUActive Life"
  regulatory_type: RegulatoryTypeSchema,

  // ===== Money =====
  currency: z.string().nullable(), // ISO 4217: SGD, USD, etc.
  annual_premium: z.number().nullable(),
  premium_frequency: PremiumFrequencySchema,
  premium_payment_term_years: z.number().nullable(),
  sum_assured: z.number().nullable(),
  // IS plan specifics (null for non-IS):
  annual_deductible: z.number().nullable(),
  co_insurance_percent: z.number().nullable(),
  co_insurance_cap: z.number().nullable(),
  annual_claim_limit: z.number().nullable(),
  lifetime_claim_limit: z.number().nullable(), // null means "unlimited" — see notes_on_money

  // ===== Dates (ISO YYYY-MM-DD) =====
  issue_date: z.string().nullable(),
  cover_start_date: z.string().nullable(),
  renewal_date: z.string().nullable(),
  maturity_date: z.string().nullable(),
  premium_cessation_date: z.string().nullable(),

  // ===== Coverage =====
  death_benefit: z.boolean(),
  terminal_illness_benefit: z.boolean(),
  tpd_benefit: z.boolean(),
  ci_coverage: CIStageCoverageSchema.nullable(), // null if non-CI policy
  riders_attached: z.array(RiderSchema),

  // ===== Beneficiaries =====
  beneficiaries: z.array(BeneficiarySchema),
  nomination_type: NominationTypeSchema,

  // ===== Exclusions =====
  notable_exclusions: z.array(z.string()), // 5–10 items, free-text
  pre_existing_excluded: z.boolean(),

  // ===== Status =====
  policy_status: PolicyStatusSchema,

  // ===== FA notes (extracted from any "FA note" or annotation in the doc) =====
  fa_review_flags: z.array(z.string()),

  // ===== Free-text caveats (when extraction was uncertain) =====
  notes_on_money: z.string().nullable(),
  notes_on_dates: z.string().nullable(),
  notes_on_coverage: z.string().nullable(),

  // ===== Extraction metadata =====
  extraction_confidence: z.enum(['high', 'medium', 'low']),
  fields_with_low_confidence: z.array(z.string()), // names of fields the model wasn't sure about
});

export type ParsedPolicySummaryV1 = z.infer<typeof ParsedPolicySummaryV1Schema>;

// Current alias — bumped when SCHEMA_VERSION increments
export const ParsedPolicySummarySchema = ParsedPolicySummaryV1Schema;
export type ParsedPolicySummary = ParsedPolicySummaryV1;

// ---------------------------------------------------------------------------
// JSON Schema for Claude tool use
// ---------------------------------------------------------------------------

/**
 * Anthropic tool definition. Claude will produce a tool_use block matching
 * this schema, which we validate against ParsedPolicySummarySchema before
 * persisting.
 *
 * Keep in sync with the Zod schema above. (We don't auto-derive because
 * Anthropic's tool_use schema format has subtle differences from Zod's
 * JSON output that we want explicit control over.)
 */
export const PARSE_BRIEF_TOOL_DEFINITION: Anthropic.Tool= {
  name: 'submit_policy_brief',
  description:
    'Submit the structured extraction of a Singapore insurance policy. ' +
    'Use null for fields not stated in the document. Do not infer or guess. ' +
    'For Singapore Integrated Shield Plans, deductible and co-insurance fields ' +
    'are mandatory. For non-IS policies they should be null.',
  input_schema: {
    type: 'object',
    required: [
      'policyholder_name',
      'policy_number',
      'insurer_name',
      'regulatory_type',
      'death_benefit',
      'terminal_illness_benefit',
      'tpd_benefit',
      'riders_attached',
      'beneficiaries',
      'nomination_type',
      'notable_exclusions',
      'pre_existing_excluded',
      'policy_status',
      'premium_frequency',
      'fa_review_flags',
      'extraction_confidence',
      'fields_with_low_confidence',
    ],
    properties: {
      policyholder_name: { type: ['string', 'null'] },
      insured_person_name: { type: ['string', 'null'] },
      nric_masked: {
        type: ['string', 'null'],
        description:
          'NRIC with all but the last 4 chars masked (e.g. SXXXXXXX-J). ' +
          'Never include a fully unredacted NRIC.',
      },
      date_of_birth: { type: ['string', 'null'], description: 'ISO YYYY-MM-DD' },
      policy_number: { type: ['string', 'null'] },
      plan_name: { type: ['string', 'null'] },
      plan_tier: { type: ['string', 'null'] },

      insurer_name: { type: ['string', 'null'] },
      product_family: { type: ['string', 'null'] },
      regulatory_type: {
        type: 'string',
        enum: [
          'is_plan', 'term_life', 'whole_life', 'ilp',
          'critical_illness', 'endowment', 'group_health',
          'personal_accident', 'disability', 'other',
        ],
      },

      currency: { type: ['string', 'null'], description: 'ISO 4217 code (SGD, USD, etc)' },
      annual_premium: { type: ['number', 'null'] },
      premium_frequency: {
        type: 'string',
        enum: ['annual', 'semi_annual', 'quarterly', 'monthly', 'single_premium', 'unknown'],
      },
      premium_payment_term_years: { type: ['number', 'null'] },
      sum_assured: { type: ['number', 'null'] },
      annual_deductible: { type: ['number', 'null'] },
      co_insurance_percent: { type: ['number', 'null'] },
      co_insurance_cap: { type: ['number', 'null'] },
      annual_claim_limit: { type: ['number', 'null'] },
      lifetime_claim_limit: {
        type: ['number', 'null'],
        description: 'null where the doc says "unlimited" — clarify in notes_on_money',
      },

      issue_date: { type: ['string', 'null'] },
      cover_start_date: { type: ['string', 'null'] },
      renewal_date: { type: ['string', 'null'] },
      maturity_date: { type: ['string', 'null'] },
      premium_cessation_date: { type: ['string', 'null'] },

      death_benefit: { type: 'boolean' },
      terminal_illness_benefit: { type: 'boolean' },
      tpd_benefit: { type: 'boolean' },
      ci_coverage: {
        type: ['object', 'null'],
        properties: {
          early_stage: { type: 'boolean' },
          intermediate_stage: { type: 'boolean' },
          severe_stage: { type: 'boolean' },
          total_conditions_covered: { type: ['number', 'null'] },
        },
        required: ['early_stage', 'intermediate_stage', 'severe_stage'],
      },
      riders_attached: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            annual_premium: { type: ['number', 'null'] },
            effect_summary: { type: ['string', 'null'] },
          },
          required: ['name'],
        },
      },

      beneficiaries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            relationship: { type: ['string', 'null'] },
            share_percent: { type: ['number', 'null'] },
          },
          required: ['name'],
        },
      },
      nomination_type: {
        type: 'string',
        enum: ['trust_nomination', 'revocable_nomination', 'beneficiary_clause', 'none_specified', 'unknown'],
      },

      notable_exclusions: {
        type: 'array',
        items: { type: 'string' },
        description: '5–10 most consequential exclusions, summarized.',
      },
      pre_existing_excluded: { type: 'boolean' },

      policy_status: {
        type: 'string',
        enum: ['in_force', 'paid_up', 'lapsed', 'surrendered', 'terminated', 'unknown'],
      },

      fa_review_flags: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Any "FA note" annotations or things flagged for advisor review (e.g. ' +
          '"ILP unit allocation review needed", "Renewal approaching"). Empty array if none.',
      },

      notes_on_money: { type: ['string', 'null'] },
      notes_on_dates: { type: ['string', 'null'] },
      notes_on_coverage: { type: ['string', 'null'] },

      extraction_confidence: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description:
          'Overall confidence. Use low for scanned/poor-quality PDFs, medium for ' +
          'partial extraction, high for clean structured documents.',
      },
      fields_with_low_confidence: {
        type: 'array',
        items: { type: 'string' },
        description: 'Field names where extraction was uncertain. Empty if none.',
      },
    },
  },
};
