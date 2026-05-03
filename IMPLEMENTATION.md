# Brain Loop v4 — Implementation Walkthrough

This is the full step-by-step. Three phases. Don't skip phases.

## Pre-flight (before Phase A)

**1. Telegram setup (do this first; you'll need the IDs)**

- Open Telegram, message @BotFather, send `/newbot`. Pick a name like "Espresso Brain". Save the bot token.
- Send any message to your new bot from your personal Telegram.
- Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` — find `chat.id` in the response. That's `TELEGRAM_WAYNE_CHAT_ID`.
- Add the bot to the chat where Elon (your OpenClaw agent) listens. Send a message to that chat from the bot. Visit getUpdates again to find that chat ID. That's `TELEGRAM_ELON_CHAT_ID`.

**2. Vercel env vars**

In Vercel project settings, add:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WAYNE_CHAT_ID`
- `TELEGRAM_ELON_CHAT_ID`
- `BRAIN_BASE_URL` = `https://espresso-mvp.vercel.app`
- Confirm `ANTHROPIC_API_KEY` already exists.

---

## Phase A — Substrate (zero behavior change)

**Goal:** tables exist. No crons. No Anthropic spend. No Telegram messages. ~5 min.

**Files to deploy:**
- `supabase/migrations/20260503_brain_loop_v4.sql`
- `brain/vision.md`
- `brain/workstreams.md`
- `brain/README.md`
- `lib/brain/telegram.ts`
- `lib/brain/vision.ts`
- `lib/brain/rotation.ts`
- `lib/brain/elon.ts`
- `lib/brain/questions.ts`
- `lib/brain/verifier.ts`
- `lib/brain/security.ts`
- `app/api/brain/tick/route.ts`
- `app/api/brain/mirror/route.ts`
- `app/api/brain/approve/route.ts`
- `app/api/brain/verify/route.ts`
- `app/api/brain/answer/route.ts`
- `app/api/brain/revert/route.ts`
- `app/api/brain/complete/route.ts`

**DO NOT add `vercel.json` yet.** Crons are off in Phase A.

**Verify Phase A:**
```sql
-- All five tables should exist:
select table_name from information_schema.tables
where table_schema='public' and table_name in
('system_state','work_orders','execution_log','brain_state','brain_questions');

-- Singleton row should be there:
select * from brain_state;
-- Expect: id=1, tick_count=0
```

**Sanity-check routes are reachable (won't trigger anything because no work has been done):**
```bash
curl -X POST https://espresso-mvp.vercel.app/api/brain/mirror \
  -H "Authorization: Bearer $CRON_SECRET"
# Expect 200 with snapshot data; 1 row in each of business/metrics/security in system_state.
```

If the curl above worked and you see one row written to `system_state`, Phase A is done. **Don't proceed to Phase B until you've eyeballed the response and it looks sensible.**

---

## Phase B — Mirror only (read-only, no Brain)

**Goal:** Mirror runs every 3 hours. You can see what data the Brain WOULD see. Still zero Anthropic spend. Run for at least 24h before Phase C.

**Change to deploy:**
Add only the Mirror cron to `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/brain/mirror", "schedule": "0 */3 * * *" }
  ]
}
```

**What you should see after 24h:**
- `system_state` has ~8 snapshot batches (one per 3h tick).
- Each batch has 4 rows: business, workflow, executions, security.
- `execution_log` has `mirror_tick` action rows.

**Eyeball check:**
```sql
select snapshot_type, source, urgent, captured_at, data
from system_state
order by captured_at desc
limit 12;
```

**What to look for:**
- Numbers in `business` look right (your actual client/policy counts).
- Nothing in `security.urgent=true` unless you actually have an issue.
- No errors in `executions.recent_failures` you don't recognize.

If anything looks wrong, fix it before Phase C. Common issues: a probed table doesn't exist (it'll show as `error` in the data), `urgent` flagging incorrectly (tune thresholds in `lib/brain/security.ts`).

---

## Phase C — Full loop (Brain + Verifier turn on)

**Goal:** Brain proposes, you approve, Elon executes, Verifier confirms. Real Anthropic spend starts.

**Change to deploy:**
Replace `vercel.json` with the full 3-cron version:
```json
{
  "crons": [
    { "path": "/api/brain/mirror", "schedule": "0 */3 * * *" },
    { "path": "/api/brain/tick", "schedule": "15 */3 * * *" },
    { "path": "/api/brain/verify", "schedule": "30 */3 * * *" }
  ]
}
```

**First Brain tick will happen at the next `:15` in your timezone.** Watch your Telegram.

**Expected behavior in the first day:**
- 0–3 work orders proposed per tick.
- Most will be `proposed` (waiting for your tap).
- A few may auto-approve (low risk + observability) and dispatch directly to Elon.
- After Elon executes, Verifier checks 30 min after dispatch. You get ✅ or ❌ Telegram.

**If something goes off the rails:**
- **Stop everything**: remove the tick + verify cron entries from `vercel.json` and redeploy. Mirror keeps running, Brain stops.
- **Reject everything pending**: `update work_orders set status='rejected' where status='proposed';`
- **Revert specific change**: tap the revert link in the verification Telegram, OR `update work_orders set status='reverted' where id='<id>';` and manually `git revert`.

---

## Tuning (after first week)

- If Brain proposes too often → raise tick interval to `*/6` or `*/12`.
- If Brain proposes the same thing repeatedly → expand the recent_orders lookback in `tick/route.ts`.
- If you want a workstream paused → comment it out in `lib/brain/rotation.ts` `WORKSTREAMS` array.
- If `urgent` security flags are noisy → tune thresholds in `lib/brain/security.ts`.
- If Verifier confidence is consistently low → spec.steps in vision.md need to be more concrete.

## Costs (rough estimate)

Each Brain tick: 1 Opus 4.7 call. Each Verifier tick: up to 5 Opus 4.7 calls (max per cycle). With 3-hour cadence: ~8 Brain + ~8 Verifier ticks/day. Conservatively budget $5–15/day in Anthropic spend depending on how much state and how many orders end up in flight.

## Recovery

Everything important is in three tables. If you need to nuke and restart:
```sql
-- Brain rotation reset:
update brain_state set tick_count=0 where id=1;

-- Or full clean (DANGER — loses history):
truncate work_orders, execution_log, brain_questions, system_state;
update brain_state set tick_count=0 where id=1;
```
