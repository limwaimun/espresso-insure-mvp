-- Batch 12b — Close self-promotion RLS hole on profiles table.
--
-- RECONSTRUCTED RETROACTIVELY from session notes, not from a canonical
-- source. Verify the live policy against Supabase dashboard if replaying.
--
-- Context: the original "Users can update own profile" policy had no
-- WITH CHECK clause, so authenticated users could PATCH their own
-- profile row and set plan='team', role='admin', or other sensitive
-- fields. Verified by exploit via curl before the fix.
--
-- Fix: DROP the permissive policy and re-CREATE with a WITH CHECK that
-- freezes the fields users must not self-modify. They can still update
-- display fields (company, full_name, etc).

-- Drop the old over-permissive policy (idempotent)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with WITH CHECK guarding the sensitive columns.
-- Users can update their own row, but only if the "frozen" fields
-- remain unchanged from what was already in the row.
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan = (SELECT plan FROM public.profiles WHERE id = auth.uid())
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    AND stripe_customer_id IS NOT DISTINCT FROM
        (SELECT stripe_customer_id FROM public.profiles WHERE id = auth.uid())
    AND stripe_subscription_id IS NOT DISTINCT FROM
        (SELECT stripe_subscription_id FROM public.profiles WHERE id = auth.uid())
    AND trial_started_at IS NOT DISTINCT FROM
        (SELECT trial_started_at FROM public.profiles WHERE id = auth.uid())
    AND trial_ends_at IS NOT DISTINCT FROM
        (SELECT trial_ends_at FROM public.profiles WHERE id = auth.uid())
  );
