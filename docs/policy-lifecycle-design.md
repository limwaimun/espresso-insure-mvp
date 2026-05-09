# Policy Lifecycle System - Design Doc

Status: Draft. Schema not yet implemented.
Last updated: 2026-05-09 SGT

## Why this exists

An FA's job is multi-year: prospecting, quoting, issuing, ongoing service, renewal cycles, claims, and lapsed-policy recovery. Today, Espresso has data about what policies exist but no structured awareness of where each is in its lifecycle.

Result:
- FAs cannot see "which renewals need my attention this week"
- No record of activity against a policy
- Maya cannot be proactively useful, no signal of "this policy stalled 14 days"
- The only place lifecycle is partially modeled today is the claims table

This design extends lifecycle modeling to every policy at every stage with multi-agent AI helping the FA stay on top of every relationship.

## Two-field state model

### current_phase: Which playbook applies?

- sales: New record, not yet issued. FA is acquiring this policy.
- ongoing: After issuance, more than 90 days to renewal. Steady state.
- renewal: 90 days or less before renewal_date. Auto-promoted by cron.
- claim: An active claim exists. Additive to ongoing/renewal, not replacing.
- lapse_recovery: Past renewal_date without renewal. FA trying to win back.

Phase transitions are mostly automatic based on time/data.

### policy_state: Where in the playbook?

States scoped per phase:

- sales: prospect to quoted to applied to underwriting to issued
- ongoing: active
- renewal: upcoming to contacted to quoted to renewed (or shopping_around or not_renewing)
- claim: delegated to claims.status (already exists)
- lapse_recovery: lapsed to re_engagement_attempted to won_back (or lost)

When phase auto-transitions, state resets to entry point of new phase.

### Why two fields not one

A policy can be ongoing/active AND have an active claim simultaneously. A single field cannot capture both. Two fields keep the data accurate without over-modeling.

## Schema additions

### policies table

Add two columns:
- current_phase TEXT NOT NULL DEFAULT 'ongoing'
- policy_state TEXT NOT NULL DEFAULT 'active'

Add CHECK constraint on current_phase enum (sales, ongoing, renewal, claim, lapse_recovery).
Add index on (current_phase, policy_state) for filter queries.

Backfill: every existing row defaults to ongoing/active. A migration script then re-evaluates each row and sets correct phase based on renewal_date.

### New table: policy_lifecycle_events

Columns:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- policy_id UUID NOT NULL FK to policies, CASCADE delete
- fa_id UUID NOT NULL FK to profiles
- client_id UUID NOT NULL FK to clients (denormalized for cross-policy queries)
- event_type TEXT NOT NULL CHECK in (stage_transition, manual_note, agent_nudge, maya_drafted, maya_sent)
- from_phase TEXT, from_state TEXT, to_phase TEXT, to_state TEXT
- text TEXT (free text for notes, optional for transitions)
- metadata JSONB DEFAULT empty (agent name, draft content, signal source)
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

Indexes on (policy_id, created_at DESC) and (fa_id, created_at DESC).
RLS enabled. Policy: FAs see own lifecycle events.

client_id is denormalized here even though available via policy_id because the most common query is "all activity on this client" spanning many policies. Avoids a join.

## Multi-agent architecture

Per the 1-2 tasks per agent rule.

### Maya (existing) - FA-facing voice

Tasks: surface, narrate, escalate.

Maya does not watch. Does not compose. She is the conversational layer that reads from policy_lifecycle_events and surfaces them to the FA in language. Maya is the only agent the FA ever directly converses with.

### Watchman (NEW) - silent observer

Tasks: scan, signal.

Cron-driven (every 6 hours). Detects:
- Renewal date approaches threshold (90d, 30d, 7d)
- Policy stalled in a state more than N days
- Renewal date passed without renewal (auto-promote to lapse_recovery/lapsed)

Each detection writes an agent_nudge row with metadata.signal_type and metadata.severity. Watchman never composes messages and never talks to the FA.

### Drafter (NEW) - message composer

Tasks: compose only.

Triggered by:
- Phase/state transitions
- High-severity Watchman nudges
- Direct FA request via Maya

Drafter calls Anthropic API with policy + client + history context. Produces a message draft. Writes a maya_drafted row with metadata.channel and metadata.draft_text. Drafter does NOT send. Sending is always FA-gated.

### Compass (existing) - coverage analyzer

Stays as-is.

### Wiring

1. Cron tick fires
2. Watchman scans policies, writes agent_nudge events
3. For high-severity signals, Drafter composes, writes maya_drafted events
4. FA opens app, Maya surfaces nudge feed
5. FA reviews, edits, accepts, maya_sent event written
6. Message goes to WhatsApp via existing webhook

## UI surfaces

### PolicyRow expanded view (per-policy)

- Stage indicator pill at top (phase color: sales=blue, renewal=amber, claim=purple, lapse_recovery=red)
- Action: Advance stage in kebab (modal with available next states)
- Action: Log activity in kebab (modal with textarea for manual_note)
- Activity timeline section at bottom of expanded view (chronological list of events)

### ClientDetailPage activity feed

Existing localActivity array augmented with policy lifecycle events for ALL of this client's policies. Read-only there. Each event shows source policy.

### Maya playground

New Active nudges panel showing unresolved agent_nudge and maya_drafted events. This is where proactive value shows up.

## Implementation phasing

- B82a: Schema migration (new fields + lifecycle_events table + RLS) - 30m
- B82b: Backfill script (set correct phase for every existing policy) - 30m
- B82c: lib/policy-lifecycle.ts (types, transition rules, validators) - 30m
- B82d: PolicyRow UI (stage indicator, advance stage modal, log activity modal) - 60m
- B82e: Activity timeline component embedded in PolicyRow expanded view - 45m
- B82f: ClientDetailPage timeline aggregation - 30m
- B82g: Watchman agent (cron + scanner + signal writer) - 90m
- B82h: Auto-transition cron (ongoing to renewal at 90d, etc) - 45m
- B82i: Drafter agent (trigger logic + Anthropic composition) - 90m
- B82j: Maya nudge surface (read maya_drafted/agent_nudge, conversational UI) - 60m
- B82k: FA accept/edit/send flow (route draft to WhatsApp webhook, maya_sent event) - 60m
- B82l: Polish, error states, edge cases - 60m

Rough total: 12-13 hours of focused work, 3-4 sessions.

## Open questions to revisit

1. Sales phase entry. Need a separate Add prospect flow, or skip sales phase for V1?
2. Stalled-state thresholds. Defaults vs FA overrides per client?
3. Multi-policy renewal cycles. Batch nudges per client or per policy?
4. Channel preferences. Where does WhatsApp/email preference live?
5. Outbound API rate limits. How to prevent FA from being overwhelmed?
6. Migration of existing claims. Phase derived from claims table, or dual-write?

## Non-goals

- Auto-sending without FA review (every outbound is FA-gated)
- Replacing WhatsApp webhook integration
- Compliance reports
- FA performance metrics
- Multi-FA collaboration on a single policy

## Risk register

- Schema drift (TEXT not ENUM keeps migrations cheap)
- Watchman noise (severity tuning critical)
- Drafter quality (start conservative)
- Auto-transition errors (backfill must be reversible)
- RLS bypass via lifecycle_events (triple-check denormalized fields)

End of design doc.
