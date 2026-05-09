> **NOTE (added 2026-05-09 evening):** This handoff describes pre-B-cleanup state.
> The B-cleanup arc (B85a-1 through B85d) was completed in the session that
> followed this handoff. References to "IFA" / "ifa_id" / queued IFA→FA work
> in this document are historical. Current state: zero IFA references remain
> in code, DB, prompts, wire formats, or active docs.

---

# Espresso Session Handoff — 2026-05-09 evening (B79m → B84 shipped)

**Session length:** ~12 hours continuous (Saturday morning to evening SGT).
**HEAD at handoff:** `49bb98d` (B84 - Scout rate limit fix + tech debt flag).
**Status:** Production stable. Major UX consistency wins shipped, lifecycle system foundation laid, critical multi-week observability bug caught and fixed.
**Brain Loop activity:** 1 order in flight at handoff time (`437c0542` - sparkline trend panel, low-risk auto-dispatched, will ship autonomously).

---

## What shipped today (in commit order)

### Manual batches (Wayne + Claude)

| Batch | Description |
|---|---|
| B79m | WhatsApp webhook logAgentInvocation (manual completion of stuck order 4488a11a) |
| B80a | Extract lib/claims.ts shared helpers (~140 lines) |
| B80b1 | ClaimCard clientInfo prop (additive) |
| B80b2 | **Rebuild claims-list using ClaimCard** — visible UX win |
| B81a | Extract lib/policies.ts shared helpers (~95 lines) |
| B81b1 | PolicyRow clientInfo prop (additive) |
| B81b2 | **Rebuild renewals using PolicyRow** — visible UX win |
| B82 design doc | Full lifecycle architecture in docs/policy-lifecycle-design.md |
| B82a | Schema migration: current_phase + policy_state + policy_lifecycle_events table |
| B82b | Backfill correct phases for 11 existing policies |
| B82c | lib/policy-lifecycle.ts (types, transitions, helpers) |
| B82d-api | /api/policy-lifecycle/log endpoint |
| B82d-ui-1 | PolicyRow stage indicator + Log activity modal |
| B82d-ui-2 | Advance stage modal + Activity timeline |
| **B83** | **CRITICAL FIX: agent-log was silent no-op for entire session** |
| B84 | Complete Scout rate limit + flag soft-protection tech debt |

### Autonomous Brain commits this session

| SHA | Title | Quality |
|---|---|---|
| `1395eaf` | Add per-IFA token spend panel to admin Overview page | Code clean. Panel hidden because table empty (until B83 fix). Now populating. |
| `b703800` (earlier) | Grammar fix homepage | Clean |
| `babf353/ddfc36a/ca64501` (earlier) | Wire logAgentInvocation into Compass/Lens/Atlas | Wiring correct, helper was broken — caught by B83. |
| `fca435f` | Add per-agent rate limiting middleware | Mostly correct. **Scout was patched with import only, no call** — caught by smoke-test, fixed in B84. |
| `<pending>` | Add per-agent invocation sparkline trend panel | In flight at handoff time. |

---

## Critical incidents this session

### 1. agent-log silent no-op (B83 - the big one)
`lib/agent-log.ts` had `process.env.SUPABASE_SERVICE_ROLE_KEY` (legacy auth scheme) instead of `SUPABASE_SECRET_KEY` (current scheme). `getClient()` returned null, every `logAgentInvocation` call silently no-op'd.

**Impact:** ZERO rows ever written to `agent_invocations` despite weeks of "wire observability" Brain commits. The B79l autonomous Brain commits that "wired observability" did genuinely wire the call sites — but the helper itself was broken.

**Discovery:** Smoke-testing the B79l-shipped per-IFA token spend panel on /admin. Panel showed nothing. Investigation: `tokensByUser` empty → no rows in `agent_invocations` → 35+ call sites all swallowing the error.

**Fix:** One-line change to read both env vars (with legacy fallback).

**Lesson:** Static analysis catches NOTHING here. Brain shipped 7 "observability" commits, all green from tsc/build perspective, all functionally dead. **B78 verifier rewrite needs runtime smoke-test.**

### 2. Schema migration pre-deploy hook conflict (B82a)
First time running schema changes manually in Supabase SQL editor — Vercel's prebuild hook (`scripts/vercel-db-push.sh`) auto-applies migrations via Supabase CLI on every deploy. Caused next deploy to fail with "column already exists."

**Resolution:** Marked migration as applied via INSERT into `supabase_migrations.schema_migrations`. Deploy went green.

**Lesson learned:** Going forward, write migration files, push to git, let Vercel apply them. Skip the SQL editor for schema changes.

### 3. Scout rate-limit incomplete (B84)
Brain order claimed "patched all 7 agent routes" but Scout got only the import, not the actual `checkRateLimit` call. Same B83-class issue (compiles clean, does nothing).

**Likely cause:** Bolt ran out of attention/budget on the 7th file.

**Fix:** Added the same auth-then-rate-limit pattern from sage/route.ts.

### 4. Bolt success path doesn't notify work_orders API (architectural flaw, not new)
Brain order `5d61fc28` (rate limiting middleware) shipped commit `fca435f` to git but `work_orders.status` stayed `running`. Manually flipped to `done`. Same flaw noted in prior session — Bolt's API-callback is one-way, doesn't fire on success either.

**Action item for next session:** small `/api/brain/complete` endpoint OR have reconciler detect "git head has commit referencing order ID + order is `running`" and auto-flip.

---

## Rate limiting tech debt (B84)

The new `lib/agent-rate-limit.ts` uses an in-process `Map`. Vercel runs serverless functions across many hot instances — each gets fresh memory. So "30 requests per hour" becomes "30 per hour PER INSTANCE." With 5 hot instances, effective limit = 5×30 = 150/hr.

**Acceptable today** (solo user, no public abuse vector). **Before opening to real users**, replace with shared state:
- Postgres `rate_limit_buckets` table (already have Supabase)
- Vercel KV (Redis-flavored)
- Upstash Redis

TECH DEBT comment is in the file. Track for B84+ revisit.

---

## Major architectural addition: Policy Lifecycle System (B82 series)

See `docs/policy-lifecycle-design.md` (181 lines). TL;DR:

**Two-field state model:**
- `current_phase`: sales/ongoing/renewal/claim/lapse_recovery (which playbook)
- `policy_state`: state within phase

**Multi-agent split** (1-2 tasks per agent rule):
- **Maya** (existing): FA-facing voice. Surface, narrate, escalate.
- **Watchman** (new, NOT YET BUILT): cron scanner. Scan, signal.
- **Drafter** (new, NOT YET BUILT): message composer. Compose only, never send.
- **Compass** (existing): coverage analyzer.

**What's shipped (B82a-d):**
- ✅ Schema (policies fields + lifecycle_events table + RLS)
- ✅ Backfill (11 policies correctly categorized: 2 lapsed, 3 in renewal, 6 ongoing)
- ✅ lib/policy-lifecycle.ts (types, transitions, helpers)
- ✅ /api/policy-lifecycle/log endpoint (manual_note + stage_transition)
- ✅ /api/policy-lifecycle/list endpoint (events for a policy)
- ✅ PolicyRow stage indicator pill in expanded view
- ✅ Log activity modal in PolicyRow kebab
- ✅ Advance stage modal in PolicyRow kebab
- ✅ Activity timeline section in PolicyRow expanded view

**What's NOT shipped (B82e-l, ~10-15 hrs more work, 3-4 sessions):**
- B82e (skipped — timeline already in PolicyRow as B82d-ui-2)
- B82f: ClientDetailPage timeline aggregation
- B82g: Watchman agent (cron + scanner)
- B82h: Auto-transition cron (ongoing → renewal at 90d)
- B82i: Drafter agent (Anthropic composition)
- B82j: Maya nudge surface
- B82k: FA accept/edit/send flow → WhatsApp webhook
- B82l: Polish, error states

---

## Open architectural gaps queued for next session

### Critical
1. **B78 verifier rewrite** (queued from prior sessions, MUCH stronger case after today). Plan: Tier 1 = smoke-test API endpoints post-deploy with curl. Tier 2 = parse `.from('table').select('cols')` and validate columns exist. Tier 3 = full integration tests (deferred). Without this, B83-class and B84-Scout-class bugs ship undetected.

2. **Bolt success/failure notification gap.** Bolt commits don't update `work_orders.status`. Reconciler runs at :45 hourly. Either: (a) small `/api/brain/complete` endpoint Bolt calls on success, OR (b) reconciler detects "commit on origin/main referencing order_id while order is `running`" and auto-flips.

3. **Rate limiter shared state** (B84 tech debt). Before any public traffic, migrate to Postgres or Vercel KV.

### Medium
4. **B82 continuation:** Watchman + Drafter agents (B82g/i). Foundation laid, agents not yet built.

5. **Brain tool call persistence** (queued from prior). `toolCallLog` in tick/route.ts is in-memory only.

6. **Directive scope enforcement.** Brain proposed work outside active directive scope before. Auto-approve gate doesn't check directive scope.

### Lower priority
7. **B82f**: ClientDetailPage timeline aggregation (pull lifecycle events into the existing `localActivity` array)
8. **xlsx vuln** (transitive dep, queued from prior)
9. **middleware → proxy rename** (Next.js 16 deprecation warning)
10. **Profiles row not auto-creating on auth.users insert**
11. **verifySession() ~400ms perf** — biggest remaining latency lever

### IMPORTANT — terminology cleanup queued (B-cleanup)
**A clean-sweep refactor is queued** to replace all "IFA" / "Independent Financial Advisor" with "FA" / "Financial Advisor" across the codebase. Per Wayne's request, all future development uses FA terminology only.

Scope:
- DB columns: `policies.ifa_id`, `clients.ifa_id`, `policy_lifecycle_events.ifa_id` (FK rename → API routes + RLS policies all change)
- 35+ TypeScript references to `ifaId` in API routes
- UI strings ("IFA accounts", "Per-IFA token spend" we just shipped today, "lib/agent-rate-limit.ts" comment)
- Documentation (today's design doc has IFAs in it; session handoffs do too)

Worth doing as a dedicated 60-90 min batch. NOT "while we're at it."

---

## What changed in repository this session

### New files
- `lib/claims.ts` (~140 lines)
- `lib/policies.ts` (~95 lines)
- `lib/policy-lifecycle.ts` (~210 lines)
- `lib/agent-rate-limit.ts` (~95 lines, +12 line tech debt comment)
- `app/api/policy-lifecycle/log/route.ts`
- `app/api/policy-lifecycle/list/route.ts`
- `app/api/admin/agent-invocations/route.ts` (Brain-shipped)
- `supabase/migrations/20260509000001_policy_lifecycle.sql`
- `supabase/migrations/20260509000002_backfill_policy_phases.sql`
- `docs/policy-lifecycle-design.md` (~181 lines)

### Heavily modified
- `app/dashboard/clients/components/ClaimCard.tsx` (clientInfo prop)
- `app/dashboard/clients/components/PolicyRow.tsx` (clientInfo prop + lifecycle UI)
- `app/dashboard/claims/page.tsx` (full rewrite using ClaimCard)
- `app/dashboard/renewals/page.tsx` (full rewrite using PolicyRow)
- `app/admin/page.tsx` (per-IFA token spend panel — Brain-shipped)
- 7 agent routes (rate-limit middleware — Brain-shipped + B84 Scout fix)
- `lib/agent-log.ts` (B83 one-line env var fix)

---

## Live state at handoff

- HEAD: `49bb98d` (B84)
- Brain order in flight: `437c0542` (sparkline trend panel)
- Brain model: `claude-sonnet-4-6`
- Executor model: `deepseek/deepseek-v4-flash`
- agent_invocations: 1 row (post-B83 fix), populating going forward
- 11 policies all correctly categorized (2 lapse_recovery/lapsed, 3 renewal/upcoming, 6 ongoing/active)
- 0 lifecycle events yet (table just created today, will populate as FAs use Log activity / Advance stage)

---

## How to pick up next session

1. Confirm production state:cd ~/.openclaw/workspace/espresso-mvp
git fetch origin && git log --oneline -102. Check Brain didn't break anything autonomously overnight:
```sql
   SELECT id, status, title, completed_at, post_completion_commit_sha
   FROM work_orders
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
```

3. Verify agent_invocations is populating:
```sql
   SELECT COUNT(*), MAX(created_at) FROM agent_invocations;
```
   Should show > 1 row with recent timestamps after FA usage.

4. Recommended priorities for next session (ranked):
   - **B78 verifier rewrite** — runtime smoke-test for new API routes. Catches B83/B84-class bugs at deploy time.
   - **Bolt success notification** — small endpoint or reconciler enhancement. Closes the bookkeeping gap.
   - **Continue B82 series** — B82f (timeline aggregation) → B82g (Watchman) → B82i (Drafter)
   - **B-cleanup IFA → FA refactor** — dedicated session

5. Recommended NOT to pick up immediately:
   - Multi-provider Brain dropdown (deferred from prior)
   - Per-FA agent model selection (needs business-tier decisions)
   - Full Watchman + Drafter scope in one session (deserves a fresh mind)

---

## Lessons from this session worth remembering

1. **Static analysis ≠ correctness.** Two B83-class bugs (broken helper + import-only Scout patch) shipped through tsc + build + Playwright tests with zero red flags. Verifier needs runtime checks.

2. **Always smoke-test Brain commits beyond stat diffs.** `git show <sha> --stat` shows file changes; it doesn't show what the code DOES. Bolt's "completed" message is also unreliable — claimed all 7 routes patched, only patched 6.

3. **In-memory state on Vercel = soft protection, not real.** Multi-instance serverless means each function instance has its own memory. Anything stateful needs Postgres or Redis.

4. **Schema migrations have TWO paths.** Vercel's prebuild auto-applies via Supabase CLI. Manual SQL editor application + Vercel = "column already exists" failure. Pick one path. Now: write migrations, let Vercel apply.

5. **Heredoc/copy-paste hell on macOS Terminal.** Bracketed paste mode + zsh's quote handling broke our doc-writing flow for ~45 min. The reliable workaround: write Python script to disk, run it. NOT inline heredocs.

6. **Wayne's smoke-tests > AI claims.** Today's most important catch (B83) came from Wayne checking a panel that should have shown data and didn't. Brain's autonomous shipping has no equivalent of "wait, that doesn't look right."

7. **Multi-batch arcs work.** B80 (claims-list) and B81 (renewals) followed identical 3-batch shapes (extract lib → add prop → rebuild page). Repeatable pattern. B82 followed similar shape (design → schema → lib → UI).

8. **Reject Brain orders only after considering blast radius.** The rate-limit order had real value; the implementation had real flaws. Both true. Right answer was to accept and patch what Brain missed (B84), not reject and lose the work.

---

End of handoff. Stop.
