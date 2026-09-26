-- supabase/migrations_004_currency_and_monthly_cycle.sql
--
-- Two related problems are fixed here.
--
-- 1. CURRENCY. `donations.amount` was being written with the USD equivalent
--    while `donations.currency` said 'KES', and `converted_amount` held the KES
--    figure. So the column named "amount" and the column named "currency"
--    described two different currencies, and every report built on them was
--    wrong. This migration makes the semantics explicit and unambiguous:
--      amount            = USD equivalent (the reporting currency)
--      currency          = 'USD' (kept populated for existing consumers)
--      amount_original   = what the donor actually paid, in charged_currency
--      charged_currency  = currency Paystack settled in (always KES here)
--      usd_amount        = same as amount, named for new code
--      fx_rate           = units of charged_currency per 1 USD at payment time
--      fx_rate_source    = where that rate came from, for auditability
--    The rate is snapshotted per donation, so a later rate change never
--    retroactively alters what a past gift was worth.
--
-- 2. MONTHLY CYCLE. Monthly sponsorships had no end date, so "is this
--    sponsorship overdue?" could not be answered. This adds an explicit
--    one-month billing period that advances on each verified payment:
--      current_period_start / current_period_end  the month just paid for
--      next_payment_due                          when the next payment is due
--    next_payment_due is derived: a sponsorship is due when the current
--    period has ended. Past due + active + monthly = overdue, which is what
--    the account and admin pages render in red.

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. donations: explicit, unambiguous currency columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS amount_original   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS charged_currency  TEXT,
  ADD COLUMN IF NOT EXISTS usd_amount        NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS fx_rate           NUMERIC(18,6),
  ADD COLUMN IF NOT EXISTS fx_rate_source    TEXT;

COMMENT ON COLUMN public.donations.amount IS
  'USD equivalent of the gift. Reporting currency for the whole platform.';
COMMENT ON COLUMN public.donations.amount_original IS
  'Amount exactly as the donor paid it, in charged_currency.';
COMMENT ON COLUMN public.donations.charged_currency IS
  'Currency Paystack settled the payment in (KES for this merchant account).';
COMMENT ON COLUMN public.donations.fx_rate IS
  'Units of charged_currency per 1 USD at the moment of payment. Snapshotted per donation.';
COMMENT ON COLUMN public.donations.fx_rate_source IS
  'Origin of fx_rate, so any figure can be traced back to a rate source.';

-- `converted_amount` and `currency` only exist on databases created from the
-- full schema; older ones may predate them. Add them if missing so the repair
-- below is safe on both shapes of database.
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS converted_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Repair existing rows.
--
-- For every historical row, `amount` already held the USD equivalent and
-- `converted_amount` held the KES figure that Paystack actually charged
-- (amount_kes in the verify function). So the fix is a reinterpretation, not
-- a recalculation: copy converted_amount into amount_original, record KES as
-- the charged currency, and derive the rate that was implicitly applied. The
-- rate is left NULL where the implied value isn't a sane rate (tiny test
-- transactions divide out to < 1 KES/USD), because a fabricated precision is
-- worse than an honest gap.
UPDATE public.donations d
SET amount_original = d.converted_amount,
    charged_currency = 'KES',
    usd_amount = d.amount,
    fx_rate = CASE
                WHEN d.converted_amount IS NOT NULL
                 AND d.amount IS NOT NULL
                 AND d.amount > 0
                 AND (d.converted_amount / d.amount) BETWEEN 1 AND 100000
                THEN ROUND((d.converted_amount / d.amount)::numeric, 6)
              END,
    fx_rate_source = CASE
                WHEN d.converted_amount IS NOT NULL
                 AND d.amount IS NOT NULL
                 AND d.amount > 0
                 AND (d.converted_amount / d.amount) BETWEEN 1 AND 100000
                THEN 'implied-historical'
              END
WHERE d.amount_original IS NULL;

-- `amount` is the USD figure, so `currency` must say USD. Existing consumers
-- that render `${amount} ${currency}` therefore become correct automatically.
UPDATE public.donations
SET currency = 'USD'
WHERE currency IS DISTINCT FROM 'USD';

-- Guard rails: these columns are money, not free text.
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_amount_positive,
  DROP CONSTRAINT IF EXISTS donations_usd_amount_positive,
  DROP CONSTRAINT IF EXISTS donations_original_amount_positive;

-- Only enforced on new/updated rows (NOT VALID) so a pre-existing anomaly
-- can't block the deploy; validate once the data has been reviewed.
ALTER TABLE public.donations
  ADD CONSTRAINT donations_usd_amount_positive
    CHECK (usd_amount IS NULL OR usd_amount > 0) NOT VALID,
  ADD CONSTRAINT donations_original_amount_positive
    CHECK (amount_original IS NULL OR amount_original > 0) NOT VALID;

-- ----------------------------------------------------------------------------
-- 2. sponsorships: explicit monthly billing period
-- ----------------------------------------------------------------------------

ALTER TABLE public.sponsorships
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_payment_due      TIMESTAMPTZ;

COMMENT ON COLUMN public.sponsorships.current_period_start IS
  'Start of the month currently paid for.';
COMMENT ON COLUMN public.sponsorships.current_period_end IS
  'End of the month currently paid for (exclusive: the next payment is due then).';
COMMENT ON COLUMN public.sponsorships.next_payment_due IS
  'When the next monthly payment is due. NULL for one-time sponsorships.';

-- Backfill from the original start date: the first period ran from the day
-- they signed up until one calendar month later. Monthly rows are the only
-- ones that get a due date. Interval arithmetic is done with make_date-style
-- month addition below so a 31st start date clamps instead of erroring.
UPDATE public.sponsorships s
SET current_period_start = s.start_date,
    current_period_end = (
      s.start_date::date + INTERVAL '1 month'
    ),
    next_payment_due = (
      s.start_date::date + INTERVAL '1 month'
    )
WHERE s.monthly_amount IS NOT NULL
  AND s.status = 'active'
  AND s.current_period_start IS NULL;

-- Monthly rows that are not active (cancelled/paused) still need a truthful
-- period so historical reporting isn't blank, but no due date — nothing is
-- owed on a cancelled sponsorship.
UPDATE public.sponsorships s
SET current_period_start = s.start_date,
    current_period_end = (s.start_date::date + INTERVAL '1 month')
WHERE s.monthly_amount IS NOT NULL
  AND s.status <> 'active'
  AND s.current_period_start IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Helper: is this monthly sponsorship overdue?
-- ----------------------------------------------------------------------------
-- Kept as SQL so the account page, the admin page and any future report all
-- agree on one definition instead of each re-deriving it (and disagreeing).
--
-- Overdue = monthly + active + has a due date + the due date has passed.
-- The comparison is on the calendar day, not the exact instant: a donor
-- shouldn't be shown "overdue" at 00:01 on the due date when they have all
-- day to pay.

CREATE OR REPLACE FUNCTION public.sponsorship_is_overdue(p_sponsorship public.sponsorships)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT p_sponsorship.monthly_amount IS NOT NULL
     AND p_sponsorship.status = 'active'
     AND p_sponsorship.next_payment_due IS NOT NULL
     AND (p_sponsorship.next_payment_due AT TIME ZONE 'UTC')::date < (now() AT TIME ZONE 'UTC')::date;
$$;

COMMENT ON FUNCTION public.sponsorship_is_overdue(public.sponsorships) IS
  'True when an active monthly sponsorship has passed its next_payment_due date.';

-- ----------------------------------------------------------------------------
-- 4. RPC: advance a monthly sponsorship to its next paid period
-- ----------------------------------------------------------------------------
-- Called by the verify-paystack-transaction Edge Function after Paystack
-- confirms a renewal payment. Security definer + explicit auth check, because
-- it writes a column that drives billing.
--
-- The new period starts where the previous one ended, so a donor who pays late
-- doesn't lose the days they already paid for and doesn't gain free time. If
-- the previous period already ended (they were overdue), the new period still
-- begins at the old due date and simply runs a month from there, which is how
-- a catch-up payment behaves.

-- IMPORTANT — this function is the ONLY thing that can move a sponsorship's
-- billing period forward, and it is deliberately NOT callable by donors.
-- If a signed-in donor could call it directly they could renew their own
-- monthly sponsorship for free, simply by invoking it from the browser. The
-- period may only advance against hard evidence that money arrived, so the
-- caller must be our own Edge Function (service role) and must pass the
-- Paystack reference of a completed donation that belongs to the donor.
CREATE OR REPLACE FUNCTION public.advance_monthly_period(
  p_sponsorship_id  uuid,
  p_payment_reference text
)
RETURNS public.sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row        public.sponsorships;
  v_donation   public.donations;
  v_start      timestamptz;
  v_already    boolean;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Not permitted' USING ERRCODE = '42501';
  END IF;

  IF p_payment_reference IS NULL OR p_payment_reference = '' THEN
    RAISE EXCEPTION 'A verified payment reference is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
  FROM public.sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsorship not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.monthly_amount IS NULL THEN
    RAISE EXCEPTION 'This is not a monthly sponsorship' USING ERRCODE = '22023';
  END IF;

  IF v_row.status = 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship was cancelled and cannot be renewed'
      USING ERRCODE = '22023';
  END IF;

  -- The payment must exist, be settled, and belong to this sponsorship's donor.
  SELECT * INTO v_donation
  FROM public.donations
  WHERE payment_reference = p_payment_reference;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No payment found for that reference'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_donation.status <> 'completed' THEN
    RAISE EXCEPTION 'That payment has not completed'
      USING ERRCODE = '22023';
  END IF;

  IF v_donation.donor_id IS DISTINCT FROM v_row.donor_id THEN
    RAISE EXCEPTION 'That payment was not made by this donor'
      USING ERRCODE = '42501';
  END IF;

  -- Re-running the same payment (webhook and the donor's browser callback can
  -- both record it) must not push the cycle out twice, so treat an
  -- already-current period as a successful no-op.
  v_already := v_row.current_period_end IS NOT NULL
               AND v_row.current_period_end > now();
  IF v_already THEN
    RETURN v_row;
  END IF;

  -- Continue from the end of the period already paid for, so a donor who pays
  -- late doesn't lose the days they already covered and isn't credited with
  -- time they haven't paid for either.
  v_start := COALESCE(v_row.current_period_end, v_row.start_date);

  IF v_start > now() THEN
    v_start := now();
  END IF;

  UPDATE public.sponsorships
  SET current_period_start = v_start,
      current_period_end   = (v_start::date + INTERVAL '1 month'),
      next_payment_due      = (v_start::date + INTERVAL '1 month'),
      status                = CASE WHEN status = 'paused' THEN 'active' ELSE status END,
      updated_at            = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM anon;
-- Only the service role (our Edge Functions) may move a billing period.
GRANT EXECUTE ON FUNCTION public.advance_monthly_period(uuid, text) TO service_role;

-- ----------------------------------------------------------------------------
-- 5. RPC: record a verified payment's FX snapshot on a donation
-- ----------------------------------------------------------------------------
-- Separate from the donation insert so the verify function and the webhook can
-- both stamp the same rate onto the same row without duplicating logic.

CREATE OR REPLACE FUNCTION public.record_donation_fx(
  p_payment_reference text,
  p_amount_original    numeric,
  p_charged_currency   text,
  p_usd_amount         numeric,
  p_fx_rate            numeric,
  p_fx_rate_source     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- The only caller is our own Edge Function using the service role, which
  -- bypasses RLS; there is no authenticated-user path to this function.
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not permitted' USING ERRCODE = '42501';
  END IF;

  UPDATE public.donations
  SET amount          = p_usd_amount,
      usd_amount      = p_usd_amount,
      amount_original = p_amount_original,
      charged_currency = p_charged_currency,
      currency        = 'USD',
      converted_amount = p_amount_original,
      fx_rate         = p_fx_rate,
      fx_rate_source  = p_fx_rate_source
  WHERE payment_reference = p_payment_reference;
END;
$$;

-- Supabase's default privileges hand EXECUTE on new public functions to anon
-- and authenticated, so revoking from PUBLIC alone is not enough here: this
-- function would be directly callable by any signed-in user. Revoke from those
-- roles explicitly and grant only the service role, which is the only caller.
REVOKE ALL ON FUNCTION public.record_donation_fx(text, numeric, text, numeric, numeric, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_donation_fx(text, numeric, text, numeric, numeric, text)
  TO service_role;

-- ----------------------------------------------------------------------------
-- 6. Reactivation re-anchors the monthly period
-- ----------------------------------------------------------------------------
-- reactivate_sponsorship in 003 has a fixed 3-argument signature. Re-declare it
-- with an extra optional p_period_start so reactivating a monthly sponsorship
-- starts a fresh paid period from today (otherwise the old period would be
-- inherited and the donor would be shown as overdue immediately).
--
-- Body is 003's implementation with the period columns set on success. The
-- ledger spend and all of 003's guards are preserved unchanged.

CREATE OR REPLACE FUNCTION public.reactivate_sponsorship(
  p_sponsorship_id uuid,
  p_plan           text   DEFAULT NULL,
  p_amount         numeric DEFAULT NULL,
  p_period_start   timestamptz DEFAULT NULL
)
RETURNS public.sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row            public.sponsorships;
  v_plan           text;
  v_row_amount     numeric;
  v_row_monthly    numeric;
  v_spend_amount   numeric;
  v_period_start   timestamptz;
  v_period_end     timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to reactivate a sponsorship'
      USING ERRCODE = '42501';
  END IF;

  -- Reject duplicate calls for the same row before taking any lock, so a double
  -- click can't spend the donor's credit twice.
  PERFORM 1 FROM public.sponsorships WHERE id = p_sponsorship_id FOR UPDATE;

  SELECT * INTO v_row
  FROM public.sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsorship not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.donor_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You can only reactivate your own sponsorship'
      USING ERRCODE = '42501';
  END IF;

  IF v_row.status <> 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is not cancelled' USING ERRCODE = '22023';
  END IF;

  -- The child must still be free, or someone else has taken them since.
  PERFORM 1 FROM public.children WHERE id = v_row.child_id FOR UPDATE;
  IF NOT EXISTS (
    SELECT 1 FROM public.children
    WHERE id = v_row.child_id AND sponsorship_status = 'available'
  ) THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship'
      USING ERRCODE = '22023';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Sponsorship plan must be one-time or monthly'
      USING ERRCODE = '22023';
  END IF;

  v_plan        := COALESCE(p_plan,
                             CASE WHEN v_row.monthly_amount IS NOT NULL
                                  THEN 'monthly' ELSE 'one-time' END);
  v_row_amount  := v_row.amount;
  v_row_monthly := v_row.monthly_amount;

  -- A monthly switch needs a figure: without one the old code reused the
  -- one-time amount as the *monthly* price, silently turning a single payment
  -- into a recurring charge.
  IF v_plan = 'monthly' AND COALESCE(p_amount, v_row_monthly) IS NULL THEN
    RAISE EXCEPTION 'A monthly sponsorship amount is required' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_amount, v_row_amount, v_row_monthly) <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero' USING ERRCODE = '22023';
  END IF;

  -- What the donor is charged for this period, resolved once and used for both
  -- the ledger spend and the stored amount so they can never diverge.
  v_spend_amount := CASE
    WHEN v_plan = 'monthly' THEN COALESCE(p_amount, v_row_monthly)
    ELSE COALESCE(p_amount, v_row_amount, v_row_monthly)
  END;

  -- Charges the donor's credit balance, refusing the whole operation if short.
  -- Raises with HINT 'INSUFFICIENT_SPONSORSHIP_CREDIT' when it can't proceed.
  PERFORM public.spend_sponsorship_credit(
    v_row.donor_id, v_spend_amount,
    'sponsorship_reactivation', v_row.id
  );

  -- A reactivated monthly sponsorship is paid for the month starting now.
  IF v_plan = 'monthly' THEN
    v_period_start := COALESCE(p_period_start, now());
    v_period_end   := (v_period_start::date + INTERVAL '1 month');
  END IF;

  UPDATE public.sponsorships
  SET status       = 'active',
      cancelled_at = NULL,
      cancelled_by = NULL,
      amount       = CASE WHEN v_plan = 'monthly' THEN NULL ELSE v_spend_amount END,
      monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_spend_amount ELSE NULL END,
      current_period_start = CASE WHEN v_plan = 'monthly' THEN v_period_start END,
      current_period_end   = CASE WHEN v_plan = 'monthly' THEN v_period_end END,
      next_payment_due     = CASE WHEN v_plan = 'monthly' THEN v_period_end END,
      updated_at    = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  -- Flip the child back to sponsored. updated_at is left to the
  -- set_children_updated_at trigger where one exists, so this also works on
  -- databases whose children table predates that column.
  UPDATE public.children
  SET sponsorship_status = 'sponsored'
  WHERE id = v_row.child_id;

  RETURN v_row;
END;
$$;

-- Same default-privilege trap as record_donation_fx above: revoking from
-- PUBLIC leaves anon with EXECUTE. The body checks auth.uid() and ownership
-- anyway, but the grant itself should say who may call it.
REVOKE ALL ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric, timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric, timestamptz)
  TO authenticated, service_role;

-- The 3-argument form from 003 must not remain callable with the old
-- signature, or PostgREST would expose two overloads and the client call would
-- be ambiguous.
DROP FUNCTION IF EXISTS public.reactivate_sponsorship(uuid, text, numeric);

-- Expose the new sponsorship columns to the donor's own reads.
GRANT SELECT (current_period_start, current_period_end, next_payment_due)
  ON public.sponsorships TO authenticated;

COMMIT;
