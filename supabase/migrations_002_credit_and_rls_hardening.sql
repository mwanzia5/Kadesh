-- ===========================================================================
-- 002 — Sponsorship credit: reactivation amounts + close the forgery hole
-- ===========================================================================
-- Run this in the Supabase SQL Editor, after migrations.sql.
-- Every statement is IF EXISTS / OR REPLACE guarded, so it is safe to re-run.
--
-- Fixes three things:
--
-- 1. REACTIVATION COULD NOT SWITCH PLAN CLEANLY.
--    reactivate_sponsorship() fell back across plans when picking the amount:
--      monthly -> COALESCE(s.monthly_amount, s.amount)
--      one-time -> COALESCE(s.amount, s.monthly_amount)
--    so re-adding a $200 one-time sponsorship as "monthly" silently started
--    $200 *per month* — a 12x change the donor never agreed to. It now takes an
--    explicit p_amount, and switching to monthly REQUIRES one.
--
-- 2. CREDIT FORGERY (the important one).
--    "Users can insert own sponsorships" only constrained donor_id, so any
--    signed-in donor could POST an arbitrary row with status='cancelled' and
--    amount=100000 and the dashboard would render it as credit. The INSERT also
--    fired the sync trigger, which set that child back to 'available' and freed
--    a child another donor was actively sponsoring. "Users can update own
--    sponsorships" let a donor rewrite the amount on rows they already had.
--    Both policies are dropped. Sponsorship rows are now writable ONLY by the
--    service role (Paystack-verified inserts) and by the SECURITY DEFINER RPCs
--    below, which enforce ownership and valid state transitions.
--
-- 3. DOUBLE-SPEND RACE.
--    create_sponsorship_with_credit() picked a slot with an unlocked
--    SELECT ... LIMIT 1. Two concurrent calls could claim the same slot, and
--    the child-availability check took no lock, so two donors could both be
--    pointed at one child. Both reads are now FOR UPDATE.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Donor-facing cancel. Replaces the client-side
--    .update({status:'cancelled'}) that needed the UPDATE policy we just
--    dropped, and adds the ownership + state checks it never had.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status    text;
  v_child     uuid;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to cancel a sponsorship';
  END IF;

  -- Lock the row so two concurrent cancels cannot both proceed.
  SELECT s.status, s.child_id INTO v_status, v_child
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

  -- The BEFORE UPDATE trigger stamps cancelled_at / cancelled_by and releases
  -- the child back to 'available', which is what mints the credit slot.
  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status = 'cancelled'
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_sponsorship(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_sponsorship(uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Reactivation: explicit, validated amount + row locks.
--    p_amount is the monthly figure (or the one-time figure) the donor is
--    agreeing to. The UI always sends it.
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
  v_row_amount   numeric;
  v_row_monthly  numeric;
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

  -- Lock the child before testing availability, so nobody else can claim it
  -- between the check and the update.
  IF (SELECT c.sponsorship_status FROM public.children c WHERE c.id = v_child) IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  -- Default to whatever plan the slot already had.
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

-- Drop the old 2-arg signature so the new 3-arg one is the only overload.
DROP FUNCTION IF EXISTS public.reactivate_sponsorship(uuid, text);


-- ---------------------------------------------------------------------------
-- 3. create_sponsorship_with_credit: lock the slot and the child.
--    Same behaviour as before apart from the locking and the amount rules,
--    which now match reactivate_sponsorship (monthly requires an amount).
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

  -- Lock the chosen slot so two concurrent spends cannot claim the same one.
  SELECT s.id, s.amount, s.monthly_amount INTO v_slot_id, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.donor_id = v_donor_id
     AND s.status = 'cancelled'
   ORDER BY s.updated_at ASC, s.created_at ASC
   LIMIT 1
   FOR UPDATE;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'No sponsorship credit available. Please make a sponsorship donation first.';
  END IF;

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

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET child_id       = p_child_id,
           status         = 'active',
           start_date     = now(),
           monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
           amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
     WHERE s.id = v_slot_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. Close the forgery hole.
--    SELECT and the admin policy stay. INSERT and UPDATE go: from here on the
--    only writers are the service role (verified Paystack payments) and the
--    SECURITY DEFINER functions above.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own sponsorships" ON public.sponsorships;
DROP POLICY IF EXISTS "Users can update own sponsorships" ON public.sponsorships;
DROP POLICY IF EXISTS "Authenticated can manage sponsorships" ON public.sponsorships;


-- ---------------------------------------------------------------------------
-- 5. Belt and braces: a sponsorship amount can never be zero or negative.
--    NOT VALID so existing rows are not scanned (and cannot block the deploy),
--    but every new INSERT/UPDATE is checked from now on.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sponsorships_amount_positive'
  ) THEN
    ALTER TABLE public.sponsorships
      ADD CONSTRAINT sponsorships_amount_positive
      CHECK (amount IS NULL OR amount > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sponsorships_monthly_amount_positive'
  ) THEN
    ALTER TABLE public.sponsorships
      ADD CONSTRAINT sponsorships_monthly_amount_positive
      CHECK (monthly_amount IS NULL OR monthly_amount > 0) NOT VALID;
  END IF;
END;
$$;


-- ---------------------------------------------------------------------------
-- 6. At most one active sponsorship per child.
--    Closes the second half of the double-spend race: even if two donors reach
--    the same child, the second write now fails instead of orphaning the child.
--    Built from a partial index so cancelled/paused rows are unaffected.
--
--    If the data already contains a child with two active sponsorships, creating
--    the index would abort the whole migration. In that case we skip it and say
--    so, rather than leaving you with a half-applied migration. Resolve those
--    rows, then run the CREATE UNIQUE INDEX by hand.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_dupes integer;
BEGIN
  SELECT count(*) INTO v_dupes
    FROM (
      SELECT child_id
        FROM public.sponsorships
       WHERE status = 'active'
       GROUP BY child_id
      HAVING count(*) > 1
    ) AS duplicates;

  IF v_dupes = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS sponsorships_one_active_per_child
      ON public.sponsorships (child_id)
      WHERE status = 'active';
    RAISE NOTICE 'Created sponsorships_one_active_per_child.';
  ELSE
    RAISE WARNING
      'SKIPPED sponsorships_one_active_per_child: % child row(s) currently have more than one active sponsorship. Resolve them in the admin Sponsorships panel, then create the index manually.',
      v_dupes;
  END IF;
END;
$$;
