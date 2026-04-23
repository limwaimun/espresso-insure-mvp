-- Batch 21 — Add updated_at columns + triggers to 4 tables
--
-- Previously only holdings had an updated_at column. The audit flagged
-- clients, policies, alerts, profiles as missing this standard field.
-- Consequences of missing updated_at: no way to sort by recency of
-- change, no basis for activity feeds, no cache invalidation key.
--
-- We introduce a single generic set_updated_at() trigger function that
-- can be reused across tables. The existing holdings.updated_at trigger
-- (which uses a table-specific update_holdings_updated_at function) is
-- left untouched — don't rewrite what works. Future tables should use
-- the generic function.

-- Generic reusable trigger function.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- clients
ALTER TABLE public.clients
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER clients_set_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- policies
ALTER TABLE public.policies
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER policies_set_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- alerts
ALTER TABLE public.alerts
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER alerts_set_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- profiles
ALTER TABLE public.profiles
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
