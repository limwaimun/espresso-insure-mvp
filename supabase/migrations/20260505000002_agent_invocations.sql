-- Agent invocations log — lightweight, append-only, for observability across
-- all in-product agents (Maya, Relay, Scout, Sage, Compass, Atlas, Lens,
-- Harbour, claim-create, WhatsApp webhook, etc).
--
-- Step 1 of the agent-observability rollout: just the table + indexes.
-- A subsequent change introduces a writer helper at lib/agent-log.ts and
-- subsequent changes wire individual agent routes to call it.
--
-- Deliberately permissive on columns (most are nullable) so partial logging
-- is better than no logging — we'd rather have a row with just agent + user
-- than block on perfect data.

create extension if not exists pgcrypto;

create table if not exists agent_invocations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agent text not null,                  -- 'maya' | 'relay' | 'scout' | 'sage' | 'compass' | 'atlas' | 'lens' | 'harbour' | 'claim-create' | 'whatsapp' | ...
  user_id uuid,                          -- IFA / profile id (nullable for anonymous/internal calls)
  source text,                           -- 'session' | 'relay' | 'webhook' | 'cron' | etc
  outcome text not null default 'ok' check (outcome in ('ok','error','rate_limited','unauthorized')),
  status_code integer,                   -- HTTP status returned
  latency_ms integer,                    -- wall-clock duration of the handler
  model text,                            -- model name if known (e.g. 'claude-sonnet-4')
  input_tokens integer,
  output_tokens integer,
  error_message text,                    -- short error string when outcome != 'ok'
  metadata jsonb not null default '{}'::jsonb  -- agent-specific extras (route, action, prompt hash, etc)
);

create index if not exists agent_invocations_created_idx on agent_invocations (created_at desc);
create index if not exists agent_invocations_agent_idx on agent_invocations (agent, created_at desc);
create index if not exists agent_invocations_user_idx on agent_invocations (user_id, created_at desc);
create index if not exists agent_invocations_outcome_idx on agent_invocations (outcome, created_at desc);

-- RLS: only service-role writes/reads. Admin dashboard queries via service-role.
alter table agent_invocations enable row level security;

-- (No policies created — without policies and with RLS enabled, only the
-- service role bypasses RLS, which is exactly what we want.)
