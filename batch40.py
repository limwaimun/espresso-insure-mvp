from pathlib import Path

ROOT = Path.cwd()
assert (ROOT / 'components' / 'HoldingsSection.tsx').exists(), \
    f"Run from repo root. Didn't find components/HoldingsSection.tsx from {ROOT}"

# ── Step 1: create lib/maya-prompts.ts ──────────────────────────────────────
maya_path = ROOT / 'lib' / 'maya-prompts.ts'
assert not maya_path.exists(), f"{maya_path} already exists — aborting"

MAYA_PROMPTS = """// Maya prompt templates for holding-level actions.
// Extracted from HoldingsSection in Batch 40. Pure functions — each returns
// the { title, prompt } object that the Ask Maya stub modal displays.
//
// TYPE_LABELS lives here (not in lib/holdings.ts) because it's a
// human-readable rendering concern specific to these prompt strings. If
// another surface ever needs it, promote it to lib/holdings.ts then.

import type { Holding } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  unit_trust: 'Unit trust',
  etf: 'ETF',
  ilp: 'ILP',
  annuity: 'Annuity',
  structured_product: 'Structured',
  other: 'Other',
}

export type MayaPrompt = { title: string; prompt: string }

export function buildHoldingReviewPrompt(h: Holding): MayaPrompt {
  return {
    title: `Review ${h.product_name} with Maya`,
    prompt: `Please review this holding for my client and share:
1. A short plain-English explanation of what this fund/product is
2. Its suitability given the client's risk rating (${h.risk_rating || 'unspecified'})
3. Any recent market context I should know before the next client review
4. Suggested talking points for the conversation

Holding: ${h.product_name}
Provider: ${h.provider}${h.platform ? ` (${h.platform})` : ''}
Type: ${TYPE_LABELS[h.product_type] || h.product_type}
Current value: ${h.currency} ${Number(h.current_value || 0).toLocaleString()}
Units: ${h.units_held ?? '—'} @ ${h.last_nav ?? '—'} (last NAV)
Inception: ${h.inception_date || '—'}
Last reviewed: ${h.last_reviewed_at ? new Date(h.last_reviewed_at).toLocaleDateString() : 'Never'}
Notes: ${h.notes || 'None'}`,
  }
}

export function buildHoldingUpdatePrompt(h: Holding): MayaPrompt {
  return {
    title: `Draft client update for ${h.product_name}`,
    prompt: `Draft a warm, concise update message I can send to my client about their ${h.product_name} holding.

Include:
- A friendly greeting using the client's first name
- A brief note on recent performance (current value ${h.currency} ${Number(h.current_value || 0).toLocaleString()})
- Any relevant market context for ${TYPE_LABELS[h.product_type] || h.product_type}
- An offer to discuss at the next review
- A warm sign-off

Keep it under 150 words. Tone: professional but personal.`,
  }
}
"""

maya_path.write_text(MAYA_PROMPTS)
print(f"✓ Created {maya_path} ({len(MAYA_PROMPTS.splitlines())} lines)")

# ── Step 2: edit HoldingsSection.tsx ────────────────────────────────────────
hs_path = ROOT / 'components' / 'HoldingsSection.tsx'
content = hs_path.read_text()
before_lines = len(content.splitlines())

# Anchor A: import insertion after the HoldingsDisplayPrimitives import
OLD_IMPORTS = """import { calcPnl, calcAnnualIncome, reviewPill, heldDuration } from '@/lib/holdings'
import { PerfItem, KV } from '@/components/HoldingsDisplayPrimitives'"""

NEW_IMPORTS = """import { calcPnl, calcAnnualIncome, reviewPill, heldDuration } from '@/lib/holdings'
import { PerfItem, KV } from '@/components/HoldingsDisplayPrimitives'
import { buildHoldingReviewPrompt, buildHoldingUpdatePrompt } from '@/lib/maya-prompts'"""

assert OLD_IMPORTS in content, "Anchor A (imports) not found — has the file been edited?"
content = content.replace(OLD_IMPORTS, NEW_IMPORTS)

# Anchor B: remove "Constants" header + TYPE_LABELS + TYPE_COLORS in one block
OLD_CONSTS = """// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  unit_trust: 'Unit trust',
  etf: 'ETF',
  ilp: 'ILP',
  annuity: 'Annuity',
  structured_product: 'Structured',
  other: 'Other',
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  unit_trust: { bg: '#E6F1FB', text: '#185FA5' },
  etf:        { bg: '#EAF3DE', text: '#27500A' },
  ilp:        { bg: '#FAEEDA', text: '#854F0B' },
  annuity:    { bg: '#EEEDFE', text: '#3C3489' },
  structured_product: { bg: '#FCEBEB', text: '#A32D2D' },
  other:      { bg: '#F1EFE8', text: '#5F5E5A' },
}

// ── Batch 8: classification dropdowns ──────────────────────────────────────"""

NEW_CONSTS = """// ── Batch 8: classification dropdowns ──────────────────────────────────────"""

assert OLD_CONSTS in content, "Anchor B (TYPE_LABELS/TYPE_COLORS block) not found"
content = content.replace(OLD_CONSTS, NEW_CONSTS)

# Anchor C: replace askMayaStub function body with 3-line delegation
OLD_ASK_MAYA = """  // Maya stubs — preview of the prompt that will be sent once agent wiring is done (Batch 3)
  function askMayaStub(h: Holding, action: 'review' | 'client_update') {
    if (action === 'review') {
      setMayaStub({
        title: `Review ${h.product_name} with Maya`,
        prompt: `Please review this holding for my client and share:
1. A short plain-English explanation of what this fund/product is
2. Its suitability given the client's risk rating (${h.risk_rating || 'unspecified'})
3. Any recent market context I should know before the next client review
4. Suggested talking points for the conversation

Holding: ${h.product_name}
Provider: ${h.provider}${h.platform ? ` (${h.platform})` : ''}
Type: ${TYPE_LABELS[h.product_type] || h.product_type}
Current value: ${h.currency} ${Number(h.current_value || 0).toLocaleString()}
Units: ${h.units_held ?? '—'} @ ${h.last_nav ?? '—'} (last NAV)
Inception: ${h.inception_date || '—'}
Last reviewed: ${h.last_reviewed_at ? new Date(h.last_reviewed_at).toLocaleDateString() : 'Never'}
Notes: ${h.notes || 'None'}`,
      })
    } else {
      setMayaStub({
        title: `Draft client update for ${h.product_name}`,
        prompt: `Draft a warm, concise update message I can send to my client about their ${h.product_name} holding.

Include:
- A friendly greeting using the client's first name
- A brief note on recent performance (current value ${h.currency} ${Number(h.current_value || 0).toLocaleString()})
- Any relevant market context for ${TYPE_LABELS[h.product_type] || h.product_type}
- An offer to discuss at the next review
- A warm sign-off

Keep it under 150 words. Tone: professional but personal.`,
      })
    }
  }"""

NEW_ASK_MAYA = """  // Maya stubs — preview of the prompt that will be sent once agent wiring is done (Batch 3)
  function askMayaStub(h: Holding, action: 'review' | 'client_update') {
    setMayaStub(action === 'review'
      ? buildHoldingReviewPrompt(h)
      : buildHoldingUpdatePrompt(h))
  }"""

assert OLD_ASK_MAYA in content, "Anchor C (askMayaStub) not found"
content = content.replace(OLD_ASK_MAYA, NEW_ASK_MAYA)

# Sanity: no stray references to the removed constants
assert 'TYPE_LABELS' not in content, "TYPE_LABELS still referenced — unexpected"
assert 'TYPE_COLORS' not in content, "TYPE_COLORS still referenced — unexpected"

hs_path.write_text(content)
after_lines = len(content.splitlines())

print(f"✓ Edited {hs_path}")
print(f"  Lines: {before_lines} → {after_lines}  ({after_lines - before_lines:+d})")
print()
print("Next: rm -rf .next && npx tsc --noEmit && npm run build && npm test")
