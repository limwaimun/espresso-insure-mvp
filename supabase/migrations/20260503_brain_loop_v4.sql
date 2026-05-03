-- Brain loop v4 — full schema, idempotent.

create extension if not exists pgcrypto;

-- system_state ----------------------------------------------------------------
create table if not exists system_state (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  snapshot_type text not null,
  source text not null,
  data jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table system_state drop constraint if exists system_state_snapshot_type_check;
  alter table system_state add constraint system_state_snapshot_type_check
    check (snapshot_type in ('metrics','errors','codemap','business','usage','security','other'));
exception when others then null;
end $$;

create index if not exists system_state_captured_idx on system_state (captured_at desc);
create index if not exists system_state_type_idx on system_state (snapshot_type, captured_at desc);

-- work_orders -----------------------------------------------------------------
create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  intent text not null,
  rationale text,
  files_to_change jsonb not null default '[]'::jsonb,
  risk_level text not null check (risk_level in ('low','medium','high')),
  category text not null,
  workstream text,
  spec jsonb,
  status text not null default 'proposed',
  auto_approved boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  dispatched_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  model_version text,
  raw_response jsonb,
  approval_token text not null default encode(gen_random_bytes(16),'hex'),
  elon_dispatch_message text,
  approval_notified_at timestamptz,
  verification_result jsonb,
  verification_attempts integer not null default 0,
  last_verification_at timestamptz,
  pre_dispatch_commit_sha text,
  post_dispatch_commit_sha text,
  involved_migration boolean not null default false,
  reverted_at timestamptz,
  revert_order_id uuid
);

alter table work_orders add column if not exists workstream text;
alter table work_orders add column if not exists approval_token text;
alter table work_orders add column if not exists elon_dispatch_message text;
alter table work_orders add column if not exists approval_notified_at timestamptz;
alter table work_orders add column if not exists verification_result jsonb;
alter table work_orders add column if not exists verification_attempts integer not null default 0;
alter table work_orders add column if not exists last_verification_at timestamptz;
alter table work_orders add column if not exists pre_dispatch_commit_sha text;
alter table work_orders add column if not exists post_dispatch_commit_sha text;
alter table work_orders add column if not exists involved_migration boolean not null default false;
alter table work_orders add column if not exists reverted_at timestamptz;
alter table work_orders add column if not exists revert_order_id uuid;

update work_orders set approval_token = encode(gen_random_bytes(16),'hex') where approval_token is null;
alter table work_orders alter column approval_token set default encode(gen_random_bytes(16),'hex');
alter table work_orders alter column approval_token set not null;

do $$ begin
  alter table work_orders drop constraint if exists work_orders_status_check;
  alter table work_orders add constraint work_orders_status_check
    check (status in ('proposed','approved','rejected','dispatched','done','verified','failed','reverted'));
exception when others then null;
end $$;

create index if not exists work_orders_status_idx on work_orders (status, created_at desc);
create index if not exists work_orders_created_idx on work_orders (created_at desc);
create index if not exists work_orders_risk_idx on work_orders (risk_level, status);
create index if not exists work_orders_workstream_idx on work_orders (workstream, created_at desc);

create or replace function touch_work_orders_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists work_orders_updated_at on work_orders;
create trigger work_orders_updated_at
  before update on work_orders
  for each row execute function touch_work_orders_updated_at();

-- execution_log ---------------------------------------------------------------
create table if not exists execution_log (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid references work_orders(id) on delete set null,
  created_at timestamptz not null default now(),
  action text not null,
  files_changed jsonb default '[]'::jsonb,
  deploy_url text,
  commit_sha text,
  success boolean not null default false,
  error_message text,
  raw_output text
);

create index if not exists execution_log_order_idx on execution_log (work_order_id, created_at desc);
create index if not exists execution_log_created_idx on execution_log (created_at desc);

-- brain_state -----------------------------------------------------------------
create table if not exists brain_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into brain_state (key, value) values ('rotation', '{"tick_index": 0}'::jsonb)
on conflict (key) do nothing;

-- brain_questions -------------------------------------------------------------
create table if not exists brain_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question text not null,
  context text,
  options jsonb not null default '[]'::jsonb,
  answer_token text not null default encode(gen_random_bytes(16),'hex'),
  status text not null default 'open' check (status in ('open','answered','dismissed')),
  chosen_option_index integer,
  chosen_option_text text,
  answered_at timestamptz,
  notified_at timestamptz,
  workstream text,
  related_order_id uuid references work_orders(id) on delete set null
);

create index if not exists brain_questions_status_idx on brain_questions (status, created_at desc);

-- RLS -------------------------------------------------------------------------
alter table system_state    enable row level security;
alter table work_orders     enable row level security;
alter table execution_log   enable row level security;
alter table brain_state     enable row level security;
alter table brain_questions enable row level security;
