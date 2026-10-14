-- Apply after supabase/migrations.sql, before deploying the updated payment functions.
-- Additive annual funding ledger. Existing card, authentication and legacy
-- sponsorship flows retain their current provider and permissions.
BEGIN;

ALTER TABLE public.sponsorships ADD COLUMN IF NOT EXISTS funding_model text;

CREATE TABLE IF NOT EXISTS public.sponsorship_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id),
  child_id uuid NOT NULL REFERENCES public.children(id),
  donor_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  support_type text NOT NULL CHECK (support_type IN ('education', 'supplies', 'meals', 'full', 'one-time', 'monthly')),
  frequency text NOT NULL CHECK (frequency IN ('one-time', 'monthly')),
  paid_at timestamptz NOT NULL,
  UNIQUE (donation_id, child_id)
);
CREATE INDEX IF NOT EXISTS sponsorship_contributions_child_year
  ON public.sponsorship_contributions(child_id, paid_at);
ALTER TABLE public.sponsorship_contributions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sponsorship_contributions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.sponsorship_contributions TO service_role;

-- Only aggregate funding and availability are public; never donor identities.
-- UTC calendar-year boundaries deliberately exclude payments from the next year.
CREATE OR REPLACE FUNCTION public.get_child_annual_funding(p_year integer)
RETURNS TABLE (
  child_id uuid, funded_amount numeric, legacy_reserved boolean,
  pending boolean, uses_annual_funding boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT c.id,
    COALESCE((SELECT sum(sc.amount)
      FROM public.sponsorship_contributions sc
      JOIN public.donations d ON d.id = sc.donation_id AND d.status = 'completed'
      WHERE sc.child_id = c.id
        AND sc.paid_at >= make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC')
        AND sc.paid_at < make_timestamptz(p_year + 1, 1, 1, 0, 0, 0, 'UTC')), 0),
    EXISTS (SELECT 1 FROM public.sponsorships s WHERE s.child_id = c.id
      AND s.funding_model IS NULL AND s.status IN ('active', 'paused'))
      OR (c.sponsorship_status = 'sponsored' AND NOT EXISTS (
        SELECT 1 FROM public.sponsorship_contributions sc WHERE sc.child_id = c.id)),
    c.sponsorship_status = 'pending',
    EXISTS (SELECT 1 FROM public.sponsorship_contributions sc WHERE sc.child_id = c.id)
  FROM public.children c
  WHERE p_year BETWEEN 2000 AND 9998;
$$;
REVOKE ALL ON FUNCTION public.get_child_annual_funding(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_child_annual_funding(integer) TO anon, authenticated, service_role;

-- Called only AFTER the existing Paystack verification/signature check.
-- Records all money actually received, including simultaneous payments. The
-- checkout checks remaining funding before payment; this ledger never silently
-- discards a real charge if two donors finish at the same time.
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

-- Preserve the legacy lifecycle; annual contributions use funding totals.
CREATE OR REPLACE FUNCTION sync_child_sponsorship_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Annual payments remain attached to their original child. Cancellation
  -- ends the relationship; it does not turn received funds into reusable credit.
  IF TG_OP = 'UPDATE' AND OLD.funding_model = 'annual_v1' THEN
    IF NEW.child_id IS DISTINCT FROM OLD.child_id OR NEW.funding_model IS DISTINCT FROM OLD.funding_model THEN
      RAISE EXCEPTION 'Annual contributions cannot be reassigned as sponsorship credit';
    END IF;
  END IF;
  IF NEW.funding_model = 'annual_v1' THEN
    IF NEW.status = 'active' THEN
      NEW.cancelled_at := NULL; NEW.paused_at := NULL;
      NEW.paused_by := NULL; NEW.cancelled_by := NULL;
    ELSIF NEW.status = 'paused' THEN
      NEW.paused_at := COALESCE(NEW.paused_at, now()); NEW.paused_by := auth.uid();
    ELSIF NEW.status = 'cancelled' THEN
      NEW.cancelled_at := COALESCE(NEW.cancelled_at, now()); NEW.cancelled_by := auth.uid();
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.status = 'active' THEN
    NEW.cancelled_at := NULL;
    NEW.paused_at := NULL;
    NEW.paused_by := NULL;
    NEW.cancelled_by := NULL;
    UPDATE public.children
      SET sponsorship_status = 'sponsored'
      WHERE id = NEW.child_id;
  ELSIF NEW.status = 'paused' THEN
    -- Child stays "sponsored" while paused so nobody else can take the slot.
    IF NEW.paused_at IS NULL THEN
      NEW.paused_at := now();
    END IF;
    NEW.paused_by := auth.uid();
  ELSIF NEW.status = 'cancelled' THEN
    IF NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := now();
    END IF;
    NEW.cancelled_by := auth.uid();
    IF TG_OP = 'INSERT' OR OLD.status <> 'cancelled' THEN
      UPDATE public.children
        SET sponsorship_status = 'available'
        WHERE id = NEW.child_id;
    END IF;
  END IF;

  -- A slot reused with credit to sponsor a different child = a re-sponsorship.
  -- Keep the chain (previous child + when) so admins can audit it.
  IF TG_OP = 'UPDATE' AND OLD.child_id IS DISTINCT FROM NEW.child_id THEN
    NEW.previous_child_id := OLD.child_id;
    NEW.reassigned_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_sponsorship_with_credit(
  p_child_id uuid,
  p_amount numeric DEFAULT NULL,
  p_plan text DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status text;
  v_slot_id uuid;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to sponsor a child';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  SELECT sponsorship_status INTO v_status
    FROM public.children
    WHERE id = p_child_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  IF v_status <> 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  SELECT id INTO v_slot_id
    FROM public.sponsorships
    WHERE donor_id = v_donor_id
      AND status = 'cancelled'
      AND funding_model IS NULL
    ORDER BY updated_at ASC
    LIMIT 1;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'No sponsorship credit available. Please make a sponsorship donation first.';
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET child_id = p_child_id,
          status = 'active',
          start_date = now(),
          monthly_amount = CASE
            WHEN p_plan = 'one-time' THEN NULL
            WHEN p_plan = 'monthly' THEN COALESCE(p_amount, s.monthly_amount, s.amount)
            ELSE COALESCE(p_amount, s.monthly_amount)
          END,
          amount = CASE
            WHEN p_plan = 'one-time' THEN COALESCE(p_amount, s.amount, s.monthly_amount)
            WHEN p_plan = 'monthly' THEN NULL
            ELSE COALESCE(p_amount, s.amount)
          END
      WHERE s.id = v_slot_id
      RETURNING s.id, s.child_id;
END;
$$;

COMMIT;
