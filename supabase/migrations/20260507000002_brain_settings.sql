-- B74 — brain_settings: singleton row holding the Brain Loop's runtime model choice.
--
-- Until now BRAIN_MODEL was hardcoded in app/api/brain/tick/route.ts to
-- 'claude-opus-4-7'. The dropdown UI in /admin/brain reads/writes this row
-- to switch the Brain's model without a code deploy.
--
-- Singleton enforced via check (id = 1). Only one row can ever exist.
-- Seeded with claude-sonnet-4-6 so the migration also delivers the cost
-- switch from Opus -> Sonnet (~5x cheaper) discussed earlier today.

create table if not exists brain_settings (
  id integer primary key default 1 check (id = 1),
  model text not null default 'claude-sonnet-4-6',
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into brain_settings (id, model)
values (1, 'claude-sonnet-4-6')
on conflict (id) do nothing;

-- RLS: deny all client access. Service-role-only.
-- The /api/brain/settings endpoint uses the service key after admin auth.
alter table brain_settings enable row level security;
