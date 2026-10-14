-- Lets a signed-in donor cancel ONE of their own ACTIVE sponsorships.
-- Donors have no direct UPDATE permission on public.sponsorships (only admins
-- do), so the account page calls this function instead.
-- Run once in Supabase > SQL Editor. It adds a function; no data is changed.
BEGIN;

CREATE OR REPLACE FUNCTION public.donor_cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (cancelled_id uuid, cancelled_child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor uuid := auth.uid();
  v_row public.sponsorships%ROWTYPE;
  v_funding record;
BEGIN
  IF v_donor IS NULL THEN
    RAISE EXCEPTION 'Please sign in to manage your sponsorships';
  END IF;

  SELECT s.* INTO v_row FROM public.sponsorships AS s
    WHERE s.id = p_sponsorship_id FOR UPDATE;
  IF NOT FOUND OR v_row.donor_id IS DISTINCT FROM v_donor THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;
  IF v_row.status = 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is already cancelled';
  END IF;
  IF v_row.status <> 'active' THEN
    RAISE EXCEPTION 'This sponsorship is paused by our team. Please contact us to make changes.';
  END IF;

  -- The sync trigger records cancelled_at / cancelled_by and, for older
  -- (reserved) sponsorships, makes the child available again.
  UPDATE public.sponsorships AS s SET status = 'cancelled' WHERE s.id = p_sponsorship_id;

  -- Annual sponsorships: availability follows this year's funding. Payments
  -- already received stay with the child; the child is available again
  -- unless the $300 target is already met or another sponsor reserves them.
  IF v_row.funding_model = 'annual_v1' THEN
    SELECT f.* INTO v_funding
      FROM public.get_child_annual_funding(
        extract(year from now() AT TIME ZONE 'UTC')::integer) AS f
      WHERE f.child_id = v_row.child_id;
    UPDATE public.children AS c SET sponsorship_status = CASE
        WHEN v_funding.pending THEN 'pending'
        WHEN v_funding.legacy_reserved OR v_funding.funded_amount >= 300 THEN 'sponsored'
        ELSE 'available' END
      WHERE c.id = v_row.child_id;
  END IF;

  RETURN QUERY SELECT v_row.id, v_row.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.donor_cancel_sponsorship(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.donor_cancel_sponsorship(uuid) TO authenticated;

COMMIT;
