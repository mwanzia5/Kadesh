-- Monthly child sponsorship: allow $25 OR $50 per month (was $25 only).
-- Run once in Supabase > SQL Editor, AFTER sponsorship-annual-funding.sql.
-- Only replaces the payment-recording function; no data is changed.
BEGIN;

CREATE OR REPLACE FUNCTION public.record_annual_sponsorship_payment(
  p_reference text, p_children jsonb, p_paid_at timestamptz
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_donation public.donations%ROWTYPE;
  v_item record;
  v_count integer;
  v_distinct integer;
  v_total numeric;
  v_expected numeric;
  v_sponsorship uuid;
  v_funding record;
  v_year integer := extract(year from now() AT TIME ZONE 'UTC');
BEGIN
  SELECT * INTO v_donation FROM public.donations
    WHERE payment_reference = p_reference FOR UPDATE;
  IF NOT FOUND OR v_donation.status IS DISTINCT FROM 'completed'
      OR v_donation.is_sponsorship IS NOT TRUE OR v_donation.donor_id IS NULL THEN
    RAISE EXCEPTION 'A verified sponsorship payment is required';
  END IF;
  IF p_paid_at IS NULL OR jsonb_typeof(p_children) IS DISTINCT FROM 'array'
      OR jsonb_array_length(p_children) = 0 THEN
    RAISE EXCEPTION 'Payment date and child allocations are required';
  END IF;
  SELECT count(*), count(DISTINCT x.child_id), sum(x.amount)
    INTO v_count, v_distinct, v_total
    FROM jsonb_to_recordset(p_children) AS x(child_id uuid, amount numeric, support_type text);
  IF v_count <> v_distinct OR v_total IS DISTINCT FROM v_donation.amount THEN
    RAISE EXCEPTION 'Child allocations must be unique and equal the payment amount';
  END IF;
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_children)
      AS x(child_id uuid, amount numeric, support_type text)
  LOOP
    v_expected := CASE v_item.support_type
      WHEN 'education' THEN 100 WHEN 'supplies' THEN 100 WHEN 'meals' THEN 100
      WHEN 'full' THEN 300 WHEN 'one-time' THEN v_item.amount
      WHEN 'monthly' THEN CASE WHEN v_item.amount IN (25, 50) THEN v_item.amount END
      ELSE NULL END;
    IF v_expected IS NULL OR v_item.amount IS DISTINCT FROM v_expected
        OR v_item.amount::text IN ('NaN', 'Infinity', '-Infinity')
        OR v_item.amount <> round(v_item.amount, 2)
        OR (v_item.support_type = 'one-time' AND v_item.amount < 25)
        OR v_donation.frequency NOT IN ('one-time', 'monthly')
        OR ((v_item.support_type = 'monthly') IS DISTINCT FROM (v_donation.frequency = 'monthly')) THEN
      RAISE EXCEPTION 'Invalid sponsorship option or frequency';
    END IF;
  END LOOP;

  -- Serialize allocations for the same children and avoid cart-order deadlocks.
  PERFORM c.id FROM public.children c
    WHERE c.id IN (SELECT x.child_id FROM jsonb_to_recordset(p_children) AS x(child_id uuid))
    ORDER BY c.id FOR UPDATE;
  IF (SELECT count(*) FROM public.children c WHERE c.id IN
      (SELECT x.child_id FROM jsonb_to_recordset(p_children) AS x(child_id uuid))) <> v_count THEN
    RAISE EXCEPTION 'A selected child no longer exists';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_children)
      AS x(child_id uuid, amount numeric, support_type text) ORDER BY child_id
  LOOP
    INSERT INTO public.sponsorship_contributions
      (donation_id, child_id, donor_id, amount, support_type, frequency, paid_at)
      VALUES (v_donation.id, v_item.child_id, v_donation.donor_id,
        v_item.amount, v_item.support_type, v_donation.frequency, p_paid_at)
      ON CONFLICT (donation_id, child_id) DO NOTHING;
    -- A webhook retry must not reactivate a subsequently cancelled relationship.
    IF NOT FOUND THEN CONTINUE; END IF;

    SELECT id INTO v_sponsorship FROM public.sponsorships
      WHERE donor_id = v_donation.donor_id AND child_id = v_item.child_id
        AND funding_model = 'annual_v1' AND status = 'active'
      ORDER BY created_at DESC LIMIT 1;
    IF v_sponsorship IS NULL THEN
      INSERT INTO public.sponsorships
        (donor_id, child_id, status, amount, monthly_amount, donation_id, funding_model, start_date)
        VALUES (v_donation.donor_id, v_item.child_id, 'active', v_item.amount,
          CASE WHEN v_donation.frequency = 'monthly' THEN v_item.amount ELSE NULL END,
          v_donation.id, 'annual_v1', p_paid_at);
    ELSE
      UPDATE public.sponsorships SET amount = COALESCE(amount, 0) + v_item.amount,
        monthly_amount = CASE WHEN v_donation.frequency = 'monthly' THEN v_item.amount ELSE monthly_amount END
        WHERE id = v_sponsorship;
    END IF;
    SELECT * INTO v_funding FROM public.get_child_annual_funding(v_year)
      WHERE child_id = v_item.child_id;
    UPDATE public.children SET sponsorship_status = CASE
      WHEN v_funding.pending THEN 'pending'
      WHEN v_funding.legacy_reserved OR v_funding.funded_amount >= 300 THEN 'sponsored'
      ELSE 'available' END
      WHERE id = v_item.child_id;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.record_annual_sponsorship_payment(text, jsonb, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_annual_sponsorship_payment(text, jsonb, timestamptz) TO service_role;

COMMIT;
