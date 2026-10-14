-- ====================================================
-- Security hardening (safe to run more than once)
-- ====================================================
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
--
-- Why: migrations.sql still creates three policies that let website visitors
-- write payment and sponsorship records straight from the browser. The site
-- no longer needs them, because every payment and sponsorship is recorded by
-- the Paystack edge functions (which use the service role and are not affected
-- by these policies) or by the existing database functions such as
-- donor_cancel_sponsorship and create_sponsorship_with_credit.
--
-- Left in place they would allow, using only the public key in the website:
--   * anyone to insert fake "completed" donations (wrong totals, fake history
--     on a donor's account page);
--   * a signed-in donor to insert an "active" sponsorship for any child
--     without paying (the child is then shown as sponsored), or a
--     "cancelled" one that the credit function treats as a free paid slot;
--   * a signed-in donor to edit their own sponsorship rows directly
--     (amount, status, child).
--
-- Admins keep full access through the "Admin can manage ..." policies.

DROP POLICY IF EXISTS "Public can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Users can insert own sponsorships" ON public.sponsorships;
DROP POLICY IF EXISTS "Users can update own sponsorships" ON public.sponsorships;

-- Check: the only remaining donations / sponsorships policies should be the
-- admin "manage" policies and the donor "view own" policies.
-- SELECT tablename, policyname, cmd FROM pg_policies
--  WHERE tablename IN ('donations', 'sponsorships') ORDER BY 1, 2;
