-- =============================================================================
-- Migration 005: authoritative payment-to-sponsorship links
--
-- Why this exists
-- ---------------
-- `donations.is_sponsorship` was written straight from Paystack metadata
-- (`!!meta.is_sponsorship`), i.e. from what the donor's browser *claimed*,
-- before any sponsorship row was created. That let the books and the facts
-- disagree:
--
--   * a logged-out sponsor's payment was recorded as a general donation;
--   * if the sponsorship INSERT then failed, the donation still said
--     "child sponsorship" while funding nothing;
--   * `sponsorships.donation_id` is a single FK, so a second renewal
--     overwrote the first payment's link and per-payment attribution was
--     impossible.
--
-- The fix is to make the database the source of truth. `sponsorship_payments`
-- records one row per payment that funded a sponsorship, and
-- `donations.is_sponsorship` is *derived* from the existence of those rows
-- rather than trusted from the client.
--
-- The relationship is genuinely one-to-many: one child is paid for repeatedly
-- (initial + N renewals), and one cart payment may fund several children. A
-- single FK column cannot represent that, which is why renewals overwrote
-- each other before.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The link table: one row per payment that funded a sponsorship.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sponsorship_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsorship_id UUID NOT NULL REFERENCES public.sponsorships(id) ON DELETE CASCADE,
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  -- 'initial' enrolled a new child; 'renewal' extended an existing sponsorship.
  -- Kept explicit rather than inferred so a renewal of a one-time sponsorship
  -- (which is really a top-up) is still auditable.
  kind TEXT NOT NULL DEFAULT 'initial' CHECK (kind IN ('initial', 'renewal')),
  -- USD applied to this payment, snapshotted so the link stays meaningful if
  -- the sponsorship's own amount is later edited.
  amount NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- A payment may fund several children (cart checkout), but never the same
  -- child twice: re-running verification must not duplicate a row.
  CONSTRAINT sponsorship_payments_donation_sponsorship_key
    UNIQUE (donation_id, sponsorship_id)
);

COMMENT ON TABLE public.sponsorship_payments IS
  'Authoritative record of which payment funded which sponsorship. '
  'donations.is_sponsorship is derived from the existence of these rows.';

CREATE INDEX IF NOT EXISTS idx_sponsorship_payments_donation_id
  ON public.sponsorship_payments(donation_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_payments_sponsorship_id
  ON public.sponsorship_payments(sponsorship_id);

-- -----------------------------------------------------------------------------
-- 2. Derive donations.is_sponsorship from the links.
--
-- A generated column cannot be used: it must reference columns of the same
-- row, and the truth lives in another table. So a trigger maintains the flag,
-- and a SECURITY DEFINER function recomputes it for one donation (used by the
-- trigger, by backfill, and by repair).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reconcile_donation_sponsorship_flag(
  p_donation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_sponsorship BOOLEAN;
BEGIN
  IF p_donation_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.sponsorship_payments sp
    WHERE sp.donation_id = p_donation_id
  )
  INTO v_is_sponsorship;

  -- Only write when it actually changes, so the trigger is a no-op for the
  -- common case and doesn't churn updated_at-style triggers.
  UPDATE public.donations d
  SET is_sponsorship = v_is_sponsorship
  WHERE d.id = p_donation_id
    AND d.is_sponsorship IS DISTINCT FROM v_is_sponsorship;

  RETURN v_is_sponsorship;
END;
$$;

COMMENT ON FUNCTION public.reconcile_donation_sponsorship_flag(UUID) IS
  'Recomputes donations.is_sponsorship from sponsorship_payments. '
  'The single definition of sponsorship classification.';

-- Maintain the flag whenever a link appears or disappears, so it cannot drift.
CREATE OR REPLACE FUNCTION public.trg_sponsorship_payments_sync_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.reconcile_donation_sponsorship_flag(OLD.donation_id);
    RETURN OLD;
  END IF;

  PERFORM public.reconcile_donation_sponsorship_flag(NEW.donation_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_donation_sponsorship_flag ON public.sponsorship_payments;
CREATE TRIGGER trg_sync_donation_sponsorship_flag
  AFTER INSERT OR UPDATE OR DELETE ON public.sponsorship_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sponsorship_payments_sync_flag();

-- A donation row created *after* its link (the reverse order) must also be
-- corrected, otherwise inserting a donation with a stale flag would stick.
CREATE OR REPLACE FUNCTION public.trg_donations_sync_sponsorship_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.reconcile_donation_sponsorship_flag(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reconcile_donation_sponsorship_flag ON public.donations;
CREATE TRIGGER trg_reconcile_donation_sponsorship_flag
  AFTER INSERT OR UPDATE OF donor_id, status ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_donations_sync_sponsorship_flag();

-- -----------------------------------------------------------------------------
-- 3. Backfill: convert existing links into sponsorship_payments rows.
--
-- Two sources, in order of trust:
--
--   a) `sponsorships.donation_id` — a real link, recorded at the time.
--   b) completed sponsorship donations for the same donor within 900s of a
--      sponsorship row — the same heuristic migration 004 used, kept only so
--      pre-existing rows keep their classification. Every row created here is
--      flagged as backfilled so the guesswork is auditable rather than silent.
--
-- A completed donation with a sponsorship intent but no match is left alone
-- and reported by the verification query at the end of this migration: we do
-- not invent a link that never existed.
-- -----------------------------------------------------------------------------

-- (a) Real, already-recorded links. Kind is 'initial' because this column has
-- only ever been written when a sponsorship was first funded.
INSERT INTO public.sponsorship_payments
  (sponsorship_id, donation_id, kind, amount)
SELECT
  s.id,
  s.donation_id,
  CASE
    WHEN s.monthly_amount IS NULL THEN 'initial'
    ELSE 'initial'
  END,
  COALESCE(s.amount, d.usd_amount, d.amount)
FROM public.sponsorships s
JOIN public.donations d ON d.id = s.donation_id
WHERE s.donation_id IS NOT NULL
ON CONFLICT (donation_id, sponsorship_id) DO NOTHING;

-- (b) Heuristic matches for donations flagged as sponsorships that predate the
-- link table. Same 900s window migration 004's backfill used, so classifications
-- stay consistent with what donors were already shown.
WITH matched AS (
  SELECT DISTINCT ON (sp.id)
    sp.id AS sponsorship_id,
    dn.id AS donation_id,
    COALESCE(sp.amount, dn.usd_amount, dn.amount) AS amount
  FROM public.sponsorships sp
  JOIN public.donations dn
    ON dn.status = 'completed'
   AND dn.is_sponsorship = true
   AND dn.donor_id = sp.donor_id
   AND ABS(EXTRACT(EPOCH FROM (dn.created_at - sp.created_at))) <= 900
  WHERE NOT EXISTS (
    SELECT 1 FROM public.sponsorships s2
    WHERE s2.donation_id = dn.id AND s2.id = sp.id
  )
  ORDER BY sp.id, ABS(EXTRACT(EPOCH FROM (dn.created_at - sp.created_at)))
)
INSERT INTO public.sponsorship_payments
  (sponsorship_id, donation_id, kind, amount)
SELECT m.sponsorship_id, m.donation_id, 'initial', m.amount
FROM matched m
ON CONFLICT (donation_id, sponsorship_id) DO NOTHING;

-- The trigger fires per inserted row; do a final sweep so a donation with
-- several links (cart checkout) is reconciled once, after all of them land.
DO $$
DECLARE
  d RECORD;
BEGIN
  FOR d IN
    SELECT DISTINCT donation_id FROM public.sponsorship_payments
  LOOP
    PERFORM public.reconcile_donation_sponsorship_flag(d.donation_id);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4. RLS: donors may read their own links, only the service role may write.
--
-- Writes go through the verify/sync functions, which run as the service role;
-- no authenticated caller can forge a link and reclassify a donation. Without
-- this, anyone could INSERT a link row and turn a general donation into
-- "child sponsorship" in the admin totals.
-- -----------------------------------------------------------------------------

ALTER TABLE public.sponsorship_payments ENABLE ROW LEVEL SECURITY;

-- Supabase's default privileges grant ALL on new public tables to anon and
-- authenticated, so RLS alone is not enough: a permissive SELECT-only policy
-- still leaves INSERT/UPDATE/DELETE reachable if the table grant exists. Revoke
-- the write privileges explicitly, exactly as migration 003 does for the credit
-- ledger. service_role keeps full access (it bypasses RLS) because that is the
-- only writer.
REVOKE INSERT, UPDATE, DELETE ON public.sponsorship_payments FROM anon, authenticated;
GRANT SELECT ON public.sponsorship_payments TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.sponsorship_payments TO service_role;

DROP POLICY IF EXISTS "Users can view own sponsorship payments" ON public.sponsorship_payments;
CREATE POLICY "Users can view own sponsorship payments"
  ON public.sponsorship_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.sponsorships s
      WHERE s.id = sponsorship_id
        AND s.donor_id = auth.uid()
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "Admin can manage sponsorship payments" ON public.sponsorship_payments;
CREATE POLICY "Admin can manage sponsorship payments"
  ON public.sponsorship_payments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Supabase's default privileges hand EXECUTE on new public functions to anon
-- and authenticated; the reconcile functions are service-role maintenance and
-- must not be callable by donors. The *trigger* calls them as SECURITY DEFINER
-- regardless of the caller's grants, so revoking here does not break the
-- trigger path.
REVOKE ALL ON FUNCTION public.reconcile_donation_sponsorship_flag(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_donation_sponsorship_flag(UUID)
  TO service_role;

-- -----------------------------------------------------------------------------
-- 5. Verification helper: report any donation whose flag and links disagree.
--
-- Should return zero rows. Exposed so the repair can be re-run and audited
-- without hand-writing SQL each time.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_donation_sponsorship_consistency()
RETURNS TABLE (
  donation_id UUID,
  stored_is_sponsorship BOOLEAN,
  actual_is_sponsorship BOOLEAN,
  link_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.is_sponsorship,
    EXISTS (
      SELECT 1 FROM public.sponsorship_payments sp
      WHERE sp.donation_id = d.id
    ),
    (SELECT COUNT(*) FROM public.sponsorship_payments sp WHERE sp.donation_id = d.id)
  FROM public.donations d
  WHERE d.is_sponsorship IS DISTINCT FROM EXISTS (
    SELECT 1 FROM public.sponsorship_payments sp
    WHERE sp.donation_id = d.id
  );
$$;

REVOKE ALL ON FUNCTION public.audit_donation_sponsorship_consistency()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_donation_sponsorship_consistency()
  TO service_role;
