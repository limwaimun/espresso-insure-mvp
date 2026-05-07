-- B71a — Add 'running' status + running_at column to work_orders.
--
-- Part of the runaway-execution fix. Today an order can be executed
-- multiple times because there's no shared concept of "this order is
-- currently being worked on by an executor." After this migration:
--
--   - Status enum gains 'running' (between 'dispatched' and 'done').
--   - running_at column tracks when execution started, used for stale-
--     run detection by a future sweeper job.
--
-- Pure additive. No existing rows change. No app code uses the new
-- state yet — that lands in B71b (claim endpoint) and B71c (executor
-- prompt). This migration alone is safe to deploy on its own.
--
-- Recovery: if an executor crashes mid-run, the order stays 'running'
-- forever until a sweeper or a manual SQL revert flips it back to
-- 'dispatched'. The sweeper is B71d (deferred).

alter table work_orders drop constraint if exists work_orders_status_check;

alter table work_orders add constraint work_orders_status_check
  check (status in (
    'proposed',
    'approved',
    'rejected',
    'dispatched',
    'running',     -- new in B71a
    'done',
    'verified',
    'failed',
    'reverted'
  ));

alter table work_orders add column if not exists running_at timestamptz;

-- Index on (status, running_at) so the future sweeper can quickly find
-- stale 'running' orders. Cheap, partial.
create index if not exists work_orders_running_idx
  on work_orders (running_at)
  where status = 'running';
