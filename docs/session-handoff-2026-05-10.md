# Espresso Session Handoff — 2026-05-10 morning (B85b/B85f arc + B86 + B87 + B85g/h)

**Session length:** ~9 hours evening 2026-05-09 + ~2 hours morning 2026-05-10.
**HEAD at handoff:** `7874df3` (B85h — Brain prompt hardened against IFA regression).
**Status:** Production stable. B-cleanup arc fully closed (codebase, DB, prompts, marketing, schema defaults, lock file, Brain's own future output). www subdomain redirect verified live.

---

## What shipped (in commit order)

### Yesterday evening session

| Batch | SHA | Title |
|---|---|---|
| B85a-1 | `2629894` | Brain system prompt: "Independent Financial Advisers (IFAs)" → "Financial Advisers (FAs)" |
| B85a-2 | `04a0f99` | Marketing page + SEO strings (11 changes across app/page.tsx + layout.tsx) |
| B85a-3 | `7b26db1` | Admin UI + agent prompts (17 changes across 6 files) |
| B85a-4 | `0df83e7` | Comments sweep (8 files) |
| B85b-1 | `2dea95f` | TypeScript identifiers + wire keys (293 changes / 44 files) |
| B85b-2 | `862085f` | Data migration only (code-side flips deferred to B85f-1; see incident below) |
| B85c | `5e6de7b` | DB schema rename (14 cols / 15 idx / 14 FKs / 22 RLS policies + 102 code refs) |
| B85d | `f06fe65` | Docs sweep |
| B85e | `4db9ef7` | Forbidden-terminology filter on Brain auto-approve gate |
| B85f-1 | `1753e9c` | Redo of missed B85b-2 work — 8 occurrences in webhook (was 7 in B85b-2's plan) |

### This morning session

| Batch | SHA | Title |
|---|---|---|
| (autonomous) | `8c6047c` | [brain] Category breakdown panel on /admin/brain Work Orders page |
| B85f-2 | `9947e37` | profiles.role default + values + trial route (DB migration + 1-line code) |
| B86 | `4f61f4e` | Remove unused xlsx package — closes HIGH-severity vuln |
| B87 | (no commit) | www.espresso.insure → espresso.insure 308 redirect (Vercel + DNS config only) |
| (autonomous) | `28ca068` | [brain] Active IFAs (last 7d) KPI — terminology regression, see incident below |
| B85g | `7a71c27` | Rename activeIFAs7d → activeFAs7d (cleans 28ca068 fallout) |
| B85h | `7874df3` | Strengthen Brain system prompt with hard terminology constraint |

**16 commits + 2 autonomous overnight + 1 config-only batch.**

---

## The B85b-2 incident — what actually happened

**Initial framing:** "B85b-2 silently failed and the audit grep gave a false green."

**Actual diagnosis (from this session's investigation):**

1. B85b-2's TARGETS dict had `whatsapp/webhook/route.ts: 7` occurrences expected.
2. The file actually had **8** (line 561 has TWO `'ifa'` literals on a single line: `role: sender.type === 'ifa' ? 'ifa' : 'client'`).
3. The recon used `grep -c "'ifa'"` which counts LINES, not OCCURRENCES.
4. B85b-2's script asserted `actual == 7`, found 8, **correctly aborted**.
5. The migration SQL file was already on disk (created in a prior step), so `git add . && git commit` only staged the migration file.
6. The commit message said "13 lowercase 'ifa' string literals across 3 files" but **only the migration shipped.**

**So B85b-2's discipline worked. Its communication failed.** The commit message overstated what actually landed.

**Implication for downstream commits:**
- B85e's commit message references "the lowercase 'ifa' literal flip in B85b-2 closes out B85b" — this is wrong; the flip was deferred.
- B85d's commit message says "B-cleanup arc is now COMPLETE" — was wrong at the time it was written (true now after B85f-1 + B85f-2 + B85g + B85h).

These are **historical commit messages — DO NOT amend.** They're noted here as record. The handoff is the correction.

---

## The 28ca068 incident — Brain regression caught + corrected

**What happened:** Autonomous Brain commit at 02:30 SGT (`8c6047c` category breakdown) was clean. Then at 22:15 SGT prior evening, Brain proposed `c35c5545` "Add 'Active IFAs (last 7d)' KPI to admin Overview". The B85e auto-approve filter correctly blocked it (matched `\bIFAs\b`). It went to manual review via Telegram. Wayne approved it overnight (~3 hrs later) without context that it had been flagged for terminology. Bolt shipped commit `28ca068` with `activeIFAs7d` state name, "Active IFAs (7d)" KPI label, and matching API field. **IFA terminology back in the codebase, 7 hours after the cleanup was declared done.**

**Diagnosis on discovery (during handoff prep):** Five `auto_approve_blocked_terminology` log entries since B85e shipped — the filter was working perfectly. The leak point was the Telegram approval flow lacking IFA-flag context at decision time. Half-asleep approve-tap at 1am SGT didn't catch the violation.

**B85g (`7a71c27`):** Renamed all four IFA references to FA. Kept Brain's underlying KPI work (it's genuinely useful). 6 changes across 2 files.

**B85h (`7874df3`):** Added explicit `# TERMINOLOGY (HARD CONSTRAINT)` section near the top of Brain's system prompt — high-attention position, immediately after the role/preamble and before Vision. Phrased as a hard NEVER, lists all surfaces (titles/intents/identifiers/strings/comments/filenames), states the consequence (filter blocks → manual review → slowdown). This targets the root cause: Brain's tendency to revert to training-data terminology in analytics/metrics contexts.

**Wayne also rejected two further IFA-flagged orders in Telegram at end-of-session** (Maya sidebar nav + a re-proposal of Active IFAs KPI). Both predated B85h. Brain will see those rejections in `recent_orders` on the next admin_dashboard tick and combined with the new prompt should learn to stop proposing IFA-flavored work.

---

## Critical incidents this session

### 1. B85b-2 deferred work caught by audit (B85f-1 fix)
Discovered while investigating role-column finding (B85f-2 prep). Audit grep returned 13 unexpected matches. Cross-referenced with `git show 862085f --stat` — only 1 file in B85b-2 commit. Diagnosis above.

Fix: B85f-1 (`1753e9c`) ran a hardened script with pre/post hash check on each file. 14 substring flips across 3 files. Verified clean.

### 2. profiles.role schema-default leak (B85f-2)
B-cleanup arc missed a schema-level IFA reference: `profiles.role` had DEFAULT `'ifa'` and 140 of 142 rows had value `'ifa'`. Not caught by any grep because column DEFAULTS aren't in code, RLS qual clauses, or pg_indexes — only in pg_attrdef.

Fix: `ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'fa'` + `UPDATE profiles SET role='fa' WHERE role='ifa'`. Migration applied via Supabase SQL editor, marked in schema_migrations. Code: defensive `role: 'fa'` added to trial-route upsert.

### 3. xlsx package was direct dependency, not transitive (B86)
Yesterday's session note said "xlsx is a transitive dep, NOT used in our code." First half wrong (it WAS in `dependencies` since commit `2eaa163`); second half right (zero imports). Pure dead weight with HIGH-severity vuln attached.

Fix: removed from package.json, regenerated lock. 9 packages purged. HIGH-sev advisory gone. Now: 3 moderate (resend/svix/uuid chain — deferred).

### 4. 28ca068 autonomous IFA regression (B85g + B85h fix)
Detailed above. Filter caught it; approval flow let it through; cleanup + prompt-strengthening close both layers.

### 5. Verify-skip pattern (twice in one session)
Both B85e and B85f-1 got committed and pushed without running `tsc + build + test` in between. Both turned out green post-fact. **Lucky, not disciplined.** Process change: **commit/push commands in a separate message AFTER verify output is pasted.** Held that line for B85f-2, B86, B85g, B85h — verify ran in all four.

---

## What we confirmed this session (saves future-Claude time)

These were on the open backlog; investigation showed they're non-issues or already done:

### Bolt success-callback "gap" — ALREADY SHIPPED
Yesterday's handoff said "Bolt commits don't update work_orders.status." Investigation shows:
- `app/api/brain/complete/route.ts` exists (atomic, idempotent, race-protected, Bearer CRON_SECRET auth)
- `app/api/brain/reconcile/route.ts` runs hourly at :45 UTC, parses `[brain] {title}` commits, matches to running orders, sweeps stale-running >60min as failed
- Both are firing in production: `elon_complete` + `reconciled` log entries observed throughout 2026-05-09
- Direct evidence: order `5d61fc28` shipped commit `fca435f`, was marked done at 10:19:01 with both pre/post SHAs

**Remove from open backlog.**

### Profiles auto-create on auth.users insert — NOT BROKEN
Yesterday's handoff said this was an open issue. Investigation showed 142/142 auth.users rows have profile rows (zero orphans). The trial-route upsert at L126 handles it. No DB trigger needed.

**Remove from open backlog.**

### messages.metadata column — NOT A BUG
Investigation flagged this as suspect because the column doesn't exist on `messages` table. Code reference at `webhook/route.ts:553` is the `metadata` parameter to `logAgentInvocation()` which writes to `agent_invocations.metadata` (a real column), NOT `messages.metadata`. Earlier B85b-2 commit message note was misleading; there's no actual bug.

**Remove from open backlog.**

### WhatsApp/Maya pipeline state — COLD
- `messages` table: 0 rows (lifetime)
- `conversations` table: 0 rows (lifetime)
- WhatsApp webhook has never fired in production

This is consistent with Meta WABA verification still pending. **When WABA approval lands, expect first-traffic surprises** — code paths in `app/api/whatsapp/webhook/route.ts` have never run end-to-end. Worth a smoke test plan when that day arrives.

### B85e auto-approve filter — FIRING CORRECTLY (revised from prior draft)
Filter has fired 5+ times since shipping (titles like "Active IFAs", "Pricing section", "Maya sidebar nav link" with IFA terms in intent/rationale). All correctly routed to manual review. The filter is doing its job at the gate level — see 28ca068 incident for the manual-approval-flow gap that B85h targets.

---

## Open architectural gaps (queued for next session)

### Critical
1. **B78 verifier rewrite.** Static analysis ≠ runtime correctness. The verifier currently does a Claude code review; doesn't catch schema/runtime bugs. Plan: Tier 1 = smoke-test API endpoints post-deploy with curl; Tier 2 = parse `.from('table').select('cols')` and validate columns exist in information_schema; Tier 3 = full integration tests (deferred). Without this, B83-class and B85f-1-class issues ship undetected. **Highest leverage remaining item.** Fresh-mind territory.

2. **Brain tool call persistence.** `toolCallLog` in `app/api/brain/tick/route.ts` is in-memory only. Without writing to `execution_log.raw_output`, we cannot audit what schemas Brain checked, what files it read, why it made decisions.

3. **Telegram approval-flow IFA-flag surfacing.** When an order has been flagged by the auto-approve filter (action: `auto_approve_blocked_terminology` in execution_log), the Telegram notification should include a prominent warning at the top: "⚠️ FLAGGED: contains forbidden terminology (matched pattern: \\bIFAs\\b)" before the title/intent. Without this, a half-asleep approval re-introduces what the filter just caught. NEW from 28ca068 incident.

### Medium
4. **B82 continuation: Watchman + Drafter agents (B82g/i).** Foundation laid; agents not built. Watchman is a cron scanner; Drafter composes WhatsApp messages. Both need fresh-mind sessions.

5. **Directive scope enforcement.** Brain can propose work outside active directive scope. Auto-approve gate doesn't check `order.workstream === active_directive.workstream`. Was a problem before; tonight's B85e closes the IFA terminology angle but not the broader scope angle.

6. **NFT trace warning on next.config.ts.** Build output:
   ```
   Encountered unexpected file in NFT list
   Import trace: ./next.config.ts → ./lib/brain/verifier.ts → ./app/api/brain/verify/route.ts
   ```
   Means Brain's verifier.ts may be doing dynamic file ops that bloat the deployed bundle. Investigate when touching B78 verifier rewrite.

### Lower priority
7. **middleware → proxy rename.** Next.js 16 deprecation warning on every build. Trivial rename when ready.
8. **verifySession() ~400ms perf.** Biggest remaining latency lever (SG → US East round-trip).
9. **3 moderate-severity npm vulns** (resend/svix/uuid chain). Near-zero real attack surface; revisit when Resend ships a version on non-vulnerable svix.
10. **`role: 'admin'` query pattern.** `lib/admin-ids.ts:14` comment notes long-term migration to role-based admin checks vs hardcoded ID. Tied to B82-class business-tier work.

### Removed from backlog this session
- ~~Bolt success-callback gap~~ (already shipped, verified)
- ~~Profiles auto-create~~ (not broken)
- ~~messages.metadata bug~~ (not a bug)
- ~~xlsx vuln cleanup~~ (B86 shipped)
- ~~www subdomain redirect~~ (B87 shipped)
- ~~Brain prompt IFA-regression risk~~ (B85h adds hard constraint)

---

## Live state at handoff

- HEAD: `7874df3` (B85h)
- Brain model: `claude-sonnet-4-6`
- Executor model: `deepseek/deepseek-v4-flash`
- Auto-approve gate: filters risk_level + category + workstream + **forbidden terminology (B85e)**
- Brain system prompt: includes **TERMINOLOGY (HARD CONSTRAINT) section near top (B85h)**
- agent_invocations: populating since B83 fix
- profiles: 142 fa, 1 admin, 0 ifa, default 'fa'::text
- messages / conversations: 0 rows lifetime (WABA pending)
- Vercel domains: `espresso.insure` (production), `www.espresso.insure` (308 → apex), `espresso-mvp.vercel.app` (production)
- 3 moderate npm vulns (deferred), 0 high (xlsx removed)
- 2 IFA-flagged orders rejected in Telegram at end-of-session (Maya nav, Active IFAs re-proposal)

---

## Lessons captured from this session

### `grep -c` vs `grep -oE | wc -l`
**`grep -c`** counts MATCHING LINES, not occurrences. Same pattern can repeat per line.
- Bit B85b-2 prep (`grep -c "'ifa'"` returned 7 for webhook; actual was 8 because line 561 has two)
- Bit B85f-1 prep again the same way
- Use `grep -roE PATTERN files/ | wc -l` for true occurrence count
- Or do counts inside a script with Python's `str.count()` which counts substrings correctly

### Schema-default leaks aren't grep-visible
Column DEFAULTs live in `pg_attrdef`, not in any code file or RLS qual clause. Grep across the codebase + RLS policies + indexes will MISS them. Future schema audits should explicitly check `information_schema.columns.column_default` against any forbidden values.

### Post-script audit isn't sufficient verification
Even when a script's audit grep returns clean, the **commit** can ship something different — if writes silently failed, were reverted by an editor, or were never staged. Always check `git show <sha> --stat` and `git diff --stat` against expected file count BEFORE trusting that "the changes shipped."

Hardened pattern (used in B85f-1, B85g, B85h):
1. Hash file content before write
2. Write
3. Re-read from disk, hash again
4. Assert hashes differ + assert post-content satisfies expected post-condition
5. THEN run the codebase-wide audit grep

### Verify-before-commit is non-negotiable
Multiple incidents this session where verify (`tsc + build + test`) was skipped between the script's "looks good" output and `git push`. Process change held going forward: **commit/push commands in a separate message AFTER verify output is pasted.** Discipline restored from B85f-2 onward.

### "Push on" momentum is real
Asking "stop or continue" with leading questions can produce confirmation bias. Better pattern: state objective fatigue signals + concrete remaining options + an honest recommendation, then defer.

### Brain auto-approve filter (B85e) is doing its job — but it's only one layer
Filter caught 5+ IFA proposals as designed. **However**, manually-approved-through orders bypass the filter. The 28ca068 incident: Brain proposed → filter blocked → routed to manual review → Wayne approved at 1am without IFA-flag context → IFA terminology shipped.

Two-layer fix needed:
- **Code layer (done):** B85g cleaned the regression
- **Prompt layer (done):** B85h hardened Brain's system prompt with hard NEVER constraint
- **Approval flow (queued):** Telegram should show "⚠️ FLAGGED: contains forbidden terminology" prominently when surfacing blocked orders for manual review

### LLM training-data drift is real
Brain reverts to "IFA" terminology when the task focus is on user-metric/analytics work, even after B85a-1's prompt update specified "FAs". B85h targets this with explicit NEVER + edge-case rebuttal ("Even when proposing analytics/metrics work..."). Lesson: positive instruction ("use FA") is inducement; hard constraint ("NEVER use IFA") is enforcement.

### Singleton commits with structured messages keep history readable
B85a-1 through B85h use the `BATCH N (subbatch): summary` prefix. Easy to scan. Easy to filter via `git log --oneline | grep BATCH`. Worth continuing.

---

## How to pick up next session

1. **Confirm production state:**
   ```bash
   cd ~/.openclaw/workspace/espresso-mvp
   git fetch origin && git log --oneline -10
   ```
   Should match `7874df3` or further. Anything beyond is autonomous Brain commits — `git show <sha> --stat` to check.

2. **Check whether the new prompt constraint is sticking:**
   ```sql
   SELECT created_at, raw_output FROM execution_log
   WHERE action = 'auto_approve_blocked_terminology'
     AND created_at >= '2026-05-10 03:00:00'
   ORDER BY created_at DESC LIMIT 10;
   ```
   Empty since B85h shipped = constraint is working. Non-empty = Brain still proposing IFA terms despite the hard NEVER. If non-empty 24+ hours after B85h, investigate prompt position or strengthen wording.

3. **Verify agent_invocations is still populating:**
   ```sql
   SELECT COUNT(*), MAX(created_at) FROM agent_invocations;
   ```
   Should be > 1 with recent timestamps.

4. **Recommended priorities (ranked):**
   - **B78 verifier rewrite** (60-90 min, fresh-mind, highest leverage)
   - **Brain tool call persistence** (30-45 min, improves auditability for free)
   - **Telegram approval-flow IFA-flag surfacing** (30-45 min, plugs the manual-approval gap from 28ca068)
   - **B82 continuation** (Watchman B82g + Drafter B82i, separate sessions each)

5. **Recommended NOT to pick up immediately:**
   - Multi-provider Brain dropdown (deferred from prior; needs OpenClaw gateway integration)
   - Per-FA agent model selection (needs business-tier decisions)
   - middleware → proxy rename (trivial but invasive; do as standalone batch)

---

End of handoff. Stop.
