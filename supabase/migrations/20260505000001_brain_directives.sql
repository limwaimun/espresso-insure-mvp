-- B68a — Brain Directives
--
-- Time-bounded focus instructions for Brain. At most one active directive
-- at a time (enforced by partial unique index). When active, Brain hard-pins
-- to the directive's workstream until expires_at or until manually ended.
--
-- Lifecycle: active -> expired (auto via expires_at) | ended (manual)

create extension if not exists pgcrypto;

create table if not exists brain_directives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  workstream text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  status text not null default 'active' check (status in ('active','expired','ended')),
  ended_at timestamptz
);

-- At most one active directive at a time.
create unique index if not exists brain_directives_one_active
  on brain_directives (status)
  where status = 'active';

-- Useful indexes for dashboard queries.
create index if not exists brain_directives_created_idx
  on brain_directives (created_at desc);

create index if not exists brain_directives_status_idx
  on brain_directives (status, created_at desc);

-- Helper: flip any active directives whose expires_at has passed to status=expired.
-- Idempotent. Safe to call from tick route as a hygiene step.
create or replace function expire_stale_directives()
returns integer as $$
declare
  affected integer;
begin
  update brain_directives
    set status = 'expired'
    where status = 'active' and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$ language plpgsql;

-- RLS: admin-only. Service role bypasses RLS.
alter table brain_directives enable row level security;

-- Drop any prior policies (idempotent reruns).
drop policy if exists brain_directives_admin_select on brain_directives;
drop policy if exists brain_directives_admin_insert on brain_directives;
drop policy if exists brain_directives_admin_update on brain_directives;

-- For now, no anon/authenticated policies. Service role only.
-- (Dashboard reads/writes happen server-side via service-role client,
--  same pattern as work_orders.)
