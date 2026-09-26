-- ===========================================================================
-- 003 — Sponsorship credit becomes a real money balance
-- ===========================================================================
-- Run after 002. Self-contained and idempotent: re-running it is a no-op.
--
-- THE BUG THIS FIXES
-- ------------------
-- Credit was never stored. The "Sponsorship Credit" number was computed on the
-- fly in the browser as:
--
--     sponsorships.filter(cancelled).reduce(+ (amount ?? monthly_amount))
--
-- and reactivation OVERWROTE the cancelled row's amount with whatever the donor
-- typed. So a donor holding $2 + $1 of cancelled sponsorships ($3) who
-- reactivated the $2 slot "for $1" lost the other $1: the row became a $1
-- active sponsorship, so the sum dropped to $1 while $2 had actually been paid.
-- The card then disagreed with reality and the donor could spend credit they no
-- longer had.
--
-- Reactivation also never checked the amount against the balance at all, so a
-- donor with $3 of credit could reactivate a $5 sponsorship and the app happily
-- accepted it.
--
-- THE MODEL
-- ---------
-- Credit is now an explicit, append-only ledger of signed amounts:
--
--     +amount  granted  (a sponsorship was cancelled; the money becomes reusable)
--     -amount  spent    (credit covered a reactivation or a new sponsorship)
--     balance  = SUM(amount) for the donor
--
-- Money is conserved: a grant is written exactly once per cancellation, and
-- every spend is recorded, so the balance always equals
--     (money paid for sponsorships now cancelled) - (money covered by credit).
--
-- Because the balance is stored rather than derived, a partial spend keeps the
-- remainder: $2 + $1 cancelled ($3), reactivate for $1 -> $2 left, not $1.
--
-- CONCURRENCY
-- -----------
-- The balance is a SUM() over many rows, so there is no single row to lock.
-- Concurrent taps would each read the same balance and both spend it. Every
-- spend therefore takes a per-donor transaction-scoped advisory lock first, so
-- spends for one donor serialise while different donors stay parallel.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. The ledger.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsorship_credit_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Signed: positive grants credit, negative spends it. Kept signed so the
  -- balance is a plain SUM with no per-row interpretation.
  amount        numeric(12,2) NOT NULL CHECK (amount <> 0),
  reason        text NOT NULL,
  sponsorship_id uuid REFERENCES public.sponsorships(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsorship_credit_ledger_donor_idx
  ON public.sponsorship_credit_ledger (donor_id, created_at);

COMMENT ON TABLE public.sponsorship_credit_ledger IS
  'Append-only ledger of sponsorship credit. Positive = granted, negative = spent. Balance = SUM(amount) per donor.';

-- Donors may read their own ledger (for a history view) and admins may read it
-- for support. There is deliberately no INSERT/UPDATE/DELETE policy: the only
-- writers are the SECURITY DEFINER functions below and the service role.
ALTER TABLE public.sponsorship_credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sponsorship credit ledger"
  ON public.sponsorship_credit_ledger;
CREATE POLICY "Users can view own sponsorship credit ledger"
  ON public.sponsorship_credit_ledger FOR SELECT
  USING (auth.uid() = donor_id);

DROP POLICY IF EXISTS "Admin can view sponsorship credit ledger"
  ON public.sponsorship_credit_ledger;
CREATE POLICY "Admin can view sponsorship credit ledger"
  ON public.sponsorship_credit_ledger FOR SELECT
  USING (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.sponsorship_credit_ledger FROM anon, authenticated;

-- Explicit rather than relying on Supabase's default privileges, so reading
-- your own balance/history works even in a project whose defaults differ.
GRANT SELECT ON public.sponsorship_credit_ledger TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Balance + grant/spend primitives.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sponsor_credit_balance(p_donor_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor uuid;
  v_bal   numeric;
BEGIN
  v_donor := COALESCE(p_donor_id, auth.uid());

  IF v_donor IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to view sponsorship credit';
  END IF;

  -- A donor may only read their own balance; admins may read anyone's.
  IF v_donor <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You can only view your own sponsorship credit';
  END IF;

  SELECT COALESCE(SUM(l.amount), 0) INTO v_bal
    FROM public.sponsorship_credit_ledger l
   WHERE l.donor_id = v_donor;

  RETURN v_bal;
END;
$$;

-- Donors read their own balance, so authenticated keeps EXECUTE here. anon does
-- not: it has no donor identity and this function re-checks the caller anyway.
REVOKE ALL ON FUNCTION public.sponsor_credit_balance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sponsor_credit_balance(uuid) TO authenticated, service_role;


-- Grants credit. Called when a sponsorship is cancelled: the money the donor
-- already paid becomes reusable, so it must be recorded exactly once.
CREATE OR REPLACE FUNCTION public.grant_sponsorship_credit(
  p_donor_id      uuid,
  p_amount        numeric,
  p_reason        text,
  p_sponsorship_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
  VALUES (p_donor_id, p_amount, p_reason, p_sponsorship_id);
END;
$$;

-- Supabase's default privileges grant EXECUTE on new public functions to anon
-- and authenticated, so revoking from PUBLIC alone would leave this callable by
-- any signed-in user — and this function mints credit with no in-body auth
-- check, since it is only ever meant to be reached through the SECURITY
-- DEFINER cancellation/reactivation RPCs. Revoke those roles explicitly.
REVOKE ALL ON FUNCTION public.grant_sponsorship_credit(uuid, numeric, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_sponsorship_credit(uuid, numeric, text, uuid)
  TO service_role;


-- Spends credit, refusing to overdraw. This is the single choke point that
-- makes the balance authoritative, so reactivation and new sponsorships cannot
-- disagree about what is available.
CREATE OR REPLACE FUNCTION public.spend_sponsorship_credit(
  p_donor_id      uuid,
  p_amount        numeric,
  p_reason        text,
  p_sponsorship_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bal numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Serialise spends for this donor for the rest of the transaction, so two
  -- concurrent reactivations cannot both read the same balance and both spend it.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_donor_id::text, 0));

  SELECT COALESCE(SUM(l.amount), 0) INTO v_bal
    FROM public.sponsorship_credit_ledger l
   WHERE l.donor_id = p_donor_id;

  IF p_amount > v_bal THEN
    -- HINT lets the client recognise this specific case and offer the
    -- "add money on the donations page" link instead of a generic failure.
    RAISE EXCEPTION USING
      ERRCODE    = 'P0001',
      MESSAGE    = format(
        'You have %s in sponsorship credit but this needs %s. Add money on the donations page to cover the difference.',
        trim(to_char(v_bal, 'FM999999990.00')),
        trim(to_char(p_amount, 'FM999999990.00'))
      ),
      HINT       = 'INSUFFICIENT_SPONSORSHIP_CREDIT',
      DETAIL     = format('available=%s required=%s', v_bal, p_amount);
  END IF;

  INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
  VALUES (p_donor_id, -p_amount, p_reason, p_sponsorship_id);
END;
$$;

-- Same default-privilege trap as grant_sponsorship_credit: the balance is only
-- authoritative if this is unreachable except through the SECURITY DEFINER
-- RPCs, so anon and authenticated are revoked explicitly.
REVOKE ALL ON FUNCTION public.spend_sponsorship_credit(uuid, numeric, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_sponsorship_credit(uuid, numeric, text, uuid)
  TO service_role;


-- ---------------------------------------------------------------------------
-- 3. Backfill: preserve the balance donors see today.
--    Without this, everyone's credit would drop to $0 the moment the dashboard
--    stopped deriving it from cancelled rows. Cancelled rows are grants that
--    predate the ledger; nothing has been spent against them yet, because
--    reactivation had no balance check to begin with.
--    The NOT EXISTS guard makes a re-run a no-op.
-- ---------------------------------------------------------------------------
INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
SELECT s.donor_id,
       COALESCE(s.amount, s.monthly_amount),
       'backfill',
       s.id
  FROM public.sponsorships s
 WHERE s.status = 'cancelled'
   AND COALESCE(s.amount, s.monthly_amount) > 0
   AND NOT EXISTS (
     SELECT 1 FROM public.sponsorship_credit_ledger l WHERE l.sponsorship_id = s.id
   );


-- ---------------------------------------------------------------------------
-- 4. Cancel now grants credit.
--    Cancelling a sponsorship you paid for is what makes that money reusable,
--    so this is where credit is created. (Previously this fell out of the
--    "sum the cancelled rows" calculation.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_child    uuid;
  v_amt      numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to cancel a sponsorship';
  END IF;

  SELECT s.status, s.child_id, COALESCE(s.amount, s.monthly_amount)
    INTO v_status, v_child, v_amt
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sponsorships s
     WHERE s.id = p_sponsorship_id AND s.donor_id = v_donor_id
  ) THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Only active sponsorships can be cancelled';
  END IF;

  -- Grant before the UPDATE so the money is recorded against the same row that
  -- is becoming cancelled. Idempotent by construction: only an 'active' row
  -- reaches here, and cancelling an already-cancelled row raises above.
  PERFORM public.grant_sponsorship_credit(
    v_donor_id, v_amt, 'sponsorship_cancelled', p_sponsorship_id
  );

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status = 'cancelled'
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_sponsorship(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_sponsorship(uuid) TO authenticated;


-- Admin cancellation must return the donor's money too, otherwise a support
-- action silently destroys their credit.
CREATE OR REPLACE FUNCTION public.admin_cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_donor  uuid;
  v_amt    numeric;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can cancel sponsorships';
  END IF;

  SELECT s.status, s.donor_id, COALESCE(s.amount, s.monthly_amount)
    INTO v_status, v_donor, v_amt
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;
  IF v_status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'This sponsorship is already cancelled';
  END IF;

  PERFORM public.grant_sponsorship_credit(
    v_donor, v_amt, 'admin_cancellation', p_sponsorship_id
  );

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET status = 'cancelled'
      WHERE s.id = p_sponsorship_id
      RETURNING s.id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_cancel_sponsorship(uuid) FROM PUBLIC;


-- ---------------------------------------------------------------------------
-- 5. Reactivation spends credit and may no longer pick a plan's amount for
--    free. The amount is now the amount being charged against the balance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reactivate_sponsorship(
  p_sponsorship_id uuid,
  p_plan           text    DEFAULT NULL,
  p_amount         numeric DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_child    uuid;
  v_row_amount  numeric;
  v_row_monthly numeric;
  v_plan     text;
  v_amount   numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to reactivate a sponsorship';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  IF p_amount IS NOT NULL AND p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Lock the slot.
  SELECT s.status, s.child_id, s.amount, s.monthly_amount
    INTO v_status, v_child, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sponsorships s
     WHERE s.id = p_sponsorship_id AND s.donor_id = v_donor_id
  ) THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;

  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is not cancelled';
  END IF;

  -- Reactivating must be paid for out of the balance, exactly like sponsoring a
  -- new child with credit. Spend before the row is revived so a rejected
  -- reactivation leaves the balance untouched.
  PERFORM public.spend_sponsorship_credit(
    v_donor_id,
    COALESCE(p_amount, v_row_amount, v_row_monthly),
    'reactivation',
    p_sponsorship_id
  );

  IF (SELECT c.sponsorship_status FROM public.children c WHERE c.id = v_child) IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  v_plan := COALESCE(
    p_plan,
    CASE WHEN v_row_monthly IS NOT NULL THEN 'monthly' ELSE 'one-time' END
  );

  IF v_plan = 'monthly' THEN
    -- Only reuse the slot's own monthly figure. Falling back to the one-time
    -- amount here is what turned $200 one-time into $200/month.
    v_amount := COALESCE(p_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the monthly amount for this sponsorship. Switching a one-time sponsorship to monthly needs an amount.';
    END IF;
  ELSE
    -- Downgrading to one-time: the slot's own one-time amount, else its
    -- monthly figure, which is a sensible single-payment default.
    v_amount := COALESCE(p_amount, v_row_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the amount for this sponsorship.';
    END IF;
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status         = 'active',
           start_date     = now(),
           monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
           amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric) TO authenticated;


-- ---------------------------------------------------------------------------
-- 6. Sponsoring a NEW child with credit spends the balance.
--    A cancelled slot is reused as the vehicle when one exists, so the
--    "reassigned from <child>" audit trail still works; otherwise a fresh row
--    is inserted (the donor's remaining balance can outlive their cancelled
--    rows after a partial reactivation).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_sponsorship_with_credit(
  p_child_id uuid,
  p_amount   numeric DEFAULT NULL,
  p_plan     text    DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_slot_id  uuid;
  v_row_amount  numeric;
  v_row_monthly numeric;
  v_plan     text;
  v_amount   numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to sponsor a child';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  IF p_amount IS NOT NULL AND p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Lock the child so two donors cannot both pass the availability check.
  PERFORM 1 FROM public.children c WHERE c.id = p_child_id FOR UPDATE;

  SELECT c.sponsorship_status INTO v_status
    FROM public.children c
   WHERE c.id = p_child_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  IF v_status <> 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  -- Reuse a cancelled slot as the vehicle when one is available, keeping the
  -- previous_child_id / reassigned_at chain intact.
  SELECT s.id, s.amount, s.monthly_amount
    INTO v_slot_id, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.donor_id = v_donor_id
     AND s.status = 'cancelled'
   ORDER BY s.updated_at ASC, s.created_at ASC
   LIMIT 1
   FOR UPDATE;

  v_plan := COALESCE(
    p_plan,
    CASE WHEN v_row_monthly IS NOT NULL THEN 'monthly' ELSE 'one-time' END
  );

  IF v_plan = 'monthly' THEN
    v_amount := COALESCE(p_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the monthly amount for this sponsorship. Switching a one-time sponsorship to monthly needs an amount.';
    END IF;
  ELSE
    v_amount := COALESCE(p_amount, v_row_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the amount for this sponsorship.';
    END IF;
  END IF;

  -- Balance is the gate, not the presence of a cancelled slot: a donor whose
  -- balance outlived their cancelled rows (partial reactivation) can still use it.
  PERFORM public.spend_sponsorship_credit(v_donor_id, v_amount, 'credit_sponsorship', v_slot_id);

  IF v_slot_id IS NOT NULL THEN
    RETURN QUERY
      UPDATE public.sponsorships AS s
         SET child_id       = p_child_id,
             status         = 'active',
             start_date     = now(),
             monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
             amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
       WHERE s.id = v_slot_id
      RETURNING s.id, s.child_id;
  ELSE
    RETURN QUERY
      INSERT INTO public.sponsorships
        (donor_id, child_id, status, start_date, monthly_amount, amount)
      VALUES
        (v_donor_id, p_child_id, 'active', now(),
         CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
         CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END)
      RETURNING id, child_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) TO authenticated;
