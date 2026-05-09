// ── Shared policy lifecycle helpers ─────────────────────────────────────────
//
// Types, labels, colors, and transition rules for the B82 policy lifecycle
// system. See docs/policy-lifecycle-design.md for full design.
//
// Two-field state model:
//   current_phase: which playbook applies (sales/ongoing/renewal/claim/lapse_recovery)
//   policy_state:  where in the playbook (states are phase-specific)

// ── Types ───────────────────────────────────────────────────────────────────

export type Phase =
  | 'sales'
  | 'ongoing'
  | 'renewal'
  | 'claim'
  | 'lapse_recovery'

// State values are TEXT in the DB, not enum, but here we type them
// per-phase to give the UI compile-time safety on transition picks.
export type SalesState =
  | 'prospect'
  | 'quoted'
  | 'applied'
  | 'underwriting'
  | 'issued'

export type OngoingState = 'active'

export type RenewalState =
  | 'upcoming'
  | 'contacted'
  | 'quoted'
  | 'renewed'
  | 'shopping_around'
  | 'not_renewing'

export type LapseRecoveryState =
  | 'lapsed'
  | 're_engagement_attempted'
  | 'won_back'
  | 'lost'

// claim phase delegates to claims.status, not modeled here.
export type State =
  | SalesState
  | OngoingState
  | RenewalState
  | LapseRecoveryState

export type EventType =
  | 'stage_transition'
  | 'manual_note'
  | 'agent_nudge'
  | 'maya_drafted'
  | 'maya_sent'

// Shape matching policy_lifecycle_events table
export interface LifecycleEvent {
  id: string
  policy_id: string
  ifa_id: string
  client_id: string
  event_type: EventType
  from_phase: Phase | null
  from_state: State | null
  to_phase: Phase | null
  to_state: State | null
  text: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ── Labels ──────────────────────────────────────────────────────────────────

export const PHASE_LABELS: Record<Phase, string> = {
  sales: 'Sales',
  ongoing: 'Active',
  renewal: 'Renewal',
  claim: 'Claim',
  lapse_recovery: 'Lapse Recovery',
}

export const STATE_LABELS: Record<string, string> = {
  // sales
  prospect: 'Prospect',
  quoted: 'Quoted',
  applied: 'Applied',
  underwriting: 'Underwriting',
  issued: 'Issued',
  // ongoing
  active: 'Active',
  // renewal
  upcoming: 'Upcoming',
  contacted: 'Contacted',
  renewed: 'Renewed',
  shopping_around: 'Shopping around',
  not_renewing: 'Not renewing',
  // lapse_recovery
  lapsed: 'Lapsed',
  re_engagement_attempted: 'Re-engagement attempted',
  won_back: 'Won back',
  lost: 'Lost',
}

export function phaseLabel(phase: string): string {
  return PHASE_LABELS[phase as Phase] ?? phase
}

export function stateLabel(state: string): string {
  return STATE_LABELS[state] ?? state
}

// ── Colors ──────────────────────────────────────────────────────────────────

// Returns { bg, text } for stage indicator pills. Mirrors the inline
// style pattern used by claims/policies status pills.
export function phaseColor(phase: string): { bg: string; text: string } {
  if (phase === 'sales') return { bg: '#E0EAF5', text: '#185FA5' }
  if (phase === 'ongoing') return { bg: '#E5F0EB', text: '#0F6E56' }
  if (phase === 'renewal') return { bg: '#FBF7EE', text: '#854F0B' }
  if (phase === 'claim') return { bg: '#EDE3F5', text: '#6D3DA0' }
  if (phase === 'lapse_recovery') return { bg: '#F8E0E0', text: '#A32D2D' }
  return { bg: '#F1EFE8', text: '#6B6460' }
}

// ── Transition rules ────────────────────────────────────────────────────────
//
// Returns the valid next [phase, state] pairs given a current phase + state.
// Used by the 'Advance stage' modal to populate the dropdown.
//
// Rules encoded:
//   sales/prospect       -> sales/quoted, sales/applied
//   sales/quoted         -> sales/applied
//   sales/applied        -> sales/underwriting
//   sales/underwriting   -> sales/issued
//   sales/issued         -> ongoing/active   (cross-phase: completes a sale)
//
//   ongoing/active       -> renewal/upcoming  (manual override; cron also does this)
//
//   renewal/upcoming     -> renewal/contacted
//   renewal/contacted    -> renewal/quoted, renewal/shopping_around
//   renewal/quoted       -> renewal/renewed, renewal/not_renewing
//   renewal/renewed      -> ongoing/active   (cross-phase: completes a renewal)
//   renewal/not_renewing -> lapse_recovery/lapsed
//
//   lapse_recovery/lapsed                  -> lapse_recovery/re_engagement_attempted
//   lapse_recovery/re_engagement_attempted -> lapse_recovery/won_back, lapse_recovery/lost
//   lapse_recovery/won_back                -> ongoing/active   (cross-phase: recovery complete)
//
// claim phase transitions are NOT modeled here — claims.status drives them.

interface Transition {
  to_phase: Phase
  to_state: State
  label: string
}

const TRANSITIONS: Record<string, Transition[]> = {
  // sales
  'sales:prospect': [
    { to_phase: 'sales', to_state: 'quoted', label: 'Mark quoted' },
    { to_phase: 'sales', to_state: 'applied', label: 'Mark applied' },
  ],
  'sales:quoted': [
    { to_phase: 'sales', to_state: 'applied', label: 'Mark applied' },
  ],
  'sales:applied': [
    { to_phase: 'sales', to_state: 'underwriting', label: 'Mark in underwriting' },
  ],
  'sales:underwriting': [
    { to_phase: 'sales', to_state: 'issued', label: 'Mark issued' },
  ],
  'sales:issued': [
    { to_phase: 'ongoing', to_state: 'active', label: 'Activate policy' },
  ],

  // ongoing
  'ongoing:active': [
    { to_phase: 'renewal', to_state: 'upcoming', label: 'Begin renewal cycle' },
  ],

  // renewal
  'renewal:upcoming': [
    { to_phase: 'renewal', to_state: 'contacted', label: 'Mark contacted' },
  ],
  'renewal:contacted': [
    { to_phase: 'renewal', to_state: 'quoted', label: 'Mark quoted' },
    { to_phase: 'renewal', to_state: 'shopping_around', label: 'Client shopping around' },
  ],
  'renewal:quoted': [
    { to_phase: 'renewal', to_state: 'renewed', label: 'Mark renewed' },
    { to_phase: 'renewal', to_state: 'not_renewing', label: 'Mark not renewing' },
  ],
  'renewal:shopping_around': [
    { to_phase: 'renewal', to_state: 'quoted', label: 'Re-quote' },
    { to_phase: 'renewal', to_state: 'not_renewing', label: 'Mark not renewing' },
  ],
  'renewal:renewed': [
    { to_phase: 'ongoing', to_state: 'active', label: 'Return to active' },
  ],
  'renewal:not_renewing': [
    { to_phase: 'lapse_recovery', to_state: 'lapsed', label: 'Move to lapse recovery' },
  ],

  // lapse_recovery
  'lapse_recovery:lapsed': [
    { to_phase: 'lapse_recovery', to_state: 're_engagement_attempted', label: 'Mark re-engagement attempted' },
  ],
  'lapse_recovery:re_engagement_attempted': [
    { to_phase: 'lapse_recovery', to_state: 'won_back', label: 'Won back' },
    { to_phase: 'lapse_recovery', to_state: 'lost', label: 'Mark lost' },
  ],
  'lapse_recovery:won_back': [
    { to_phase: 'ongoing', to_state: 'active', label: 'Return to active' },
  ],
}

export function validTransitions(phase: string, state: string): Transition[] {
  return TRANSITIONS[`${phase}:${state}`] ?? []
}
