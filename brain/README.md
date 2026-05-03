# Brain Loop — Operator Notes (v4)

## Required env vars

| Var | Phase needed |
|---|---|
| `CRON_SECRET` (existing) | A |
| `SUPABASE_SECRET_KEY` (existing) | A |
| `NEXT_PUBLIC_SUPABASE_URL` (existing) | A |
| `ANTHROPIC_API_KEY` | C |
| `TELEGRAM_BOT_TOKEN` | C |
| `TELEGRAM_ELON_CHAT_ID` | C |
| `TELEGRAM_WAYNE_CHAT_ID` | C |
| `BRAIN_BASE_URL` | C |

## Cron schedule (3-hour cycle)
- `:00` — Mirror — snapshots state into `system_state`
- `:15` — Brain — reads state + vision, proposes
- `:30` — Verifier — checks dispatched orders against deployed code

## Workstream rotation
Brain has 4 workstreams (marketing, fa_app, ai_agents, admin_dashboard). Each tick rotates: tick N targets workstream `N % 4`. Brain may return `[]` if rotated workstream has nothing pressing. Tick counter persists in `brain_state` table.

## Approval lanes
- **Auto-approve**: `risk_level=low` AND `category in (copy, observability)`; or low security work that is purely logs/metrics/audit-trail.
- **Wayne approves** (Telegram tap): everything else.
- **Hard gate**: high risk, anything touching policies/holdings/claims/billing/auth/PII.

## Routes
- `POST /api/brain/mirror` — Mirror cron
- `POST /api/brain/tick` — Brain cron
- `POST /api/brain/verify` — Verifier cron
- `GET /api/brain/approve?id=&token=&action=` — Wayne approval link
- `GET /api/brain/answer?id=&token=&choice=` — Wayne answers Brain's question
- `GET /api/brain/revert?id=&token=` — Wayne taps revert
- `POST /api/brain/elon-callback?id=&token=` — Elon reports pre/post commit SHAs

## Manual ops
```sql
select id, title, status, risk_level, category, workstream, created_at
from work_orders where status='proposed' order by created_at desc;

select id, question, options, workstream, created_at
from brain_questions where status='open' order by created_at desc;

select * from brain_state where key='rotation';
```

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://espresso-mvp.vercel.app/api/brain/mirror
curl -H "Authorization: Bearer $CRON_SECRET" https://espresso-mvp.vercel.app/api/brain/tick
```

## Phased deploy
**Phase A — Substrate.** Apply migration. No crons. No Telegram. Verify tables exist.
**Phase B — Mirror only.** Add Mirror cron. Run for 24h. Inspect `system_state` rows. Zero Anthropic spend.
**Phase C — Full loop.** Add Brain + Verifier crons. Telegram bot configured. First pings begin.

## How rollback works
- Elon POSTs his pre-deploy commit SHA to `/api/brain/elon-callback?id=...&token=...` BEFORE deploying.
- If Verifier fails or Wayne wants to revert, Wayne gets a Telegram with a "Revert" link.
- Tapping creates a NEW work order that asks Elon to `git revert` and redeploy.
- If the original involved a SQL migration, the revert link warns Wayne that code revert won't reverse the schema.
- If pre-dispatch SHA was never captured, revert link refuses and tells Wayne to do it manually.
