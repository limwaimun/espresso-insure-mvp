/**
 * Layer B — section index schema.
 *
 * The 16 section_kind values mirror the DB CHECK constraint exactly
 * (see supabase/migrations/20260510000001_policy_extraction_schema.sql).
 * Adding/removing a kind here requires a migration.
 *
 * Schema versioning: incremented when the canonical taxonomy or required
 * fields change. v1 = initial release.
 */

import { z } from 'zod'
import type Anthropic from '@anthropic-ai/sdk'

export const SECTIONS_SCHEMA_VERSION = 1

export const SECTION_KINDS = [
  'schedule',
  'definitions',
  'summary',
  'benefits',
  'surgical_schedule',
  'exclusions',
  'premiums',
  'claims',
  'conditions',
  'free_look',
  'termination',
  'signatures',
  'cover',
  'welcome',
  'toc',
  'other',
] as const

export const SectionEntrySchema = z.object({
  section_kind: z.enum(SECTION_KINDS),
  section_label: z.string().nullish(),
  page_start: z.number().int().nullish(),
  page_end: z.number().int().nullish(),
})

export type SectionEntry = z.infer<typeof SectionEntrySchema>

export const PolicySectionsSchema = z.object({
  sections: z
    .array(SectionEntrySchema)
    .min(1, 'At least one section must be returned'),
  extraction_confidence: z.enum(['low', 'medium', 'high']),
  notes_on_structure: z.string().nullish(),
})

export type PolicySectionsResult = z.infer<typeof PolicySectionsSchema>

// ---------------------------------------------------------------------------
// Anthropic tool-use definition
// ---------------------------------------------------------------------------

export const PARSE_SECTIONS_TOOL_DEFINITION: Anthropic.Tool = {
  name: 'submit_policy_sections',
  description:
    'Submit the canonical section index for a Singapore insurance policy ' +
    'document. Each section maps to one of the 16 controlled section_kind ' +
    'values, with the literal section_label as it appears in the document ' +
    'and a page range. Do not extract section content — only the index.',
  input_schema: {
    type: 'object',
    required: ['sections', 'extraction_confidence'],
    properties: {
      sections: {
        type: 'array',
        description:
          'Ordered list of major sections in the document. Aim for 5–15 ' +
          'sections per policy; over-fragmenting hurts downstream routing.',
        items: {
          type: 'object',
          required: ['section_kind'],
          properties: {
            section_kind: {
              type: 'string',
              enum: [...SECTION_KINDS],
              description:
                'Canonical classification. Use "other" only if no specific ' +
                'category fits. The same kind can appear multiple times if ' +
                'the document has multiple separate sections of that kind.',
            },
            section_label: {
              type: ['string', 'null'],
              description:
                'The literal heading text as it appears in the document, ' +
                'e.g. "Section 3 — Definitions and Interpretation". Null if ' +
                'no heading text is present.',
            },
            page_start: {
              type: ['number', 'null'],
              description:
                'First page of this section. Use the document\'s own page ' +
                'numbering (from headers/footers) when available; otherwise ' +
                'count from page 1 of the PDF.',
            },
            page_end: {
              type: ['number', 'null'],
              description:
                'Last page of this section, inclusive. Same numbering ' +
                'convention as page_start.',
            },
          },
        },
      },
      extraction_confidence: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description:
          'high: clean PDF with explicit section headings. ' +
          'medium: structural inference required. ' +
          'low: scanned/fragmentary document.',
      },
      notes_on_structure: {
        type: ['string', 'null'],
        description:
          'Optional caveats about the section index — e.g. ambiguous ' +
          'section boundaries, missing page numbers, sections that span ' +
          'non-contiguous pages.',
      },
    },
  },
}
