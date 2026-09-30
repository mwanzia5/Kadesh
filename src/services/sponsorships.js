import supabase from "@/supabase/client";

export async function getSponsorships(donorId) {
  try {
    const { data, error } = await supabase
      .from("sponsorships")
      .select("*, children(*), donations(*)")
      .eq("donor_id", donorId)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error };

    // Attach the reassigned-from child (previous_child_id) so the account card
    // can show who the donor's credit was moved away from. previous_child_id
    // has no foreign key (keeping sponsorships.child_id unambiguous for the
    // `children(*)` embed), so look the names up separately.
    const prevIds = [
      ...new Set((data || []).map((s) => s.previous_child_id).filter(Boolean)),
    ];
    if (prevIds.length > 0) {
      const { data: prevChildren, error: prevError } = await supabase
        .from("children")
        .select("id, first_name")
        .in("id", prevIds);
      if (prevError) return { data, error: null };
      const prevMap = new Map((prevChildren || []).map((c) => [c.id, c]));
      return {
        data: (data || []).map((s) => ({
          ...s,
          // Donation amount fallback for rows whose amount column is null but
          // whose linked donation was recorded (older one-time sponsorships).
          amount: s.amount ?? s.donations?.amount ?? null,
          previous_child: s.previous_child_id
            ? prevMap.get(s.previous_child_id) || null
            : null,
        })),
        error: null,
      };
    }

    return {
      data: (data || []).map((s) => ({
        ...s,
        amount: s.amount ?? s.donations?.amount ?? null,
      })),
      error: null,
    };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getSponsorship(id) {
  try {
    const { data, error } = await supabase
      .from("sponsorships")
      .select("*, children(*)")
      .eq("id", id)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function cancelSponsorship(id) {
  try {
    const { data, error } = await supabase
      .from("sponsorships")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

// Admin-only lifecycle actions. These go through dedicated SECURITY DEFINER
// RPCs (admin_pause_sponsorship / admin_resume_sponsorship /
// admin_cancel_sponsorship) that enforce the transition rules and restrict
// execution to allowlisted admins. The sync trigger keeps the child reserved
// while paused and only releases it on cancel.

export async function pauseSponsorship(id) {
  try {
    const { data, error } = await supabase.rpc("admin_pause_sponsorship", {
      p_sponsorship_id: id,
    });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function resumeSponsorship(id) {
  try {
    const { data, error } = await supabase.rpc("admin_resume_sponsorship", {
      p_sponsorship_id: id,
    });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function adminCancelSponsorship(id) {
  try {
    const { data, error } = await supabase.rpc("admin_cancel_sponsorship", {
      p_sponsorship_id: id,
    });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

// The donor's spendable sponsorship credit, in money.
//
// This used to be computed in the browser by summing cancelled sponsorship rows,
// which drifted: reactivation overwrote a row's amount, so a partial spend
// silently destroyed the remainder and the card disagreed with what the donor
// had actually paid. The server now keeps an append-only ledger and this reads
// the real balance.
//
// Returns a number (0 when there is no credit). Postgres returns numerics as
// strings, so it is coerced here rather than at every call site.
export async function getSponsorshipCreditBalance() {
  const { data, error } = await supabase.rpc("sponsor_credit_balance");
  if (error) throw error;
  return Number(data ?? 0);
}

// True when the server refused an operation for lack of credit.
// spend_sponsorship_credit raises with this HINT so the UI can offer "add money
// on the donations page" instead of a generic failure. Checked on both hint and
// message because PostgREST does not always surface hint.
export function isInsufficientCreditError(err) {
  if (!err) return false;
  const hint = err.hint ?? err.HINT ?? "";
  const message = err.message ?? "";
  return (
    hint === "INSUFFICIENT_SPONSORSHIP_CREDIT" ||
    message.includes("INSUFFICIENT_SPONSORSHIP_CREDIT") ||
    /sponsorship credit but this needs/i.test(message)
  );
}

// Sponsors a child using an existing, already-paid sponsorship credit (no new
// payment). `amount` is charged against the credit balance, which the server
// enforces: it refuses the whole operation if the balance is short, so a donor
// can never put a child on the list without the money to cover them.
// `plan` sets it to 'one-time' or 'monthly' (omit to keep the slot's plan).
export async function sponsorWithCredit({ childId, amount, plan }) {
  const { data, error } = await supabase.rpc("create_sponsorship_with_credit", {
    p_child_id: childId,
    p_amount: amount != null && amount !== "" ? Number(amount) : null,
    p_plan: plan || null,
  });
  if (error) throw error;
  return data?.[0] ?? data;
}

// Reactivates a cancelled sponsorship (sets it back to "active"), charging the
// amount against the donor's sponsorship credit. The trigger flips the child
// back to "sponsored".
//
// `amount` is what the donor has agreed to pay going forward and is always sent
// by the UI. Without it the old implementation reused the one-time amount as
// the *monthly* figure, quietly turning a single $200 payment into $200/month.
//
// The server refuses the reactivation when the amount exceeds the donor's
// credit balance, and charges it against that balance when it succeeds, so
// repeated reactivations draw down the credit correctly.
//
// `plan` switches to 'one-time' or 'monthly'; when omitted the slot keeps its
// existing plan. Throws if the slot isn't the donor's, isn't cancelled, the
// child has been taken, or there isn't enough credit.
export async function reactivateSponsorship(
  sponsorshipId,
  plan,
  amount,
  periodStart
) {
  const { data, error } = await supabase.rpc("reactivate_sponsorship", {
    p_sponsorship_id: sponsorshipId,
    p_plan: plan || null,
    p_amount: amount != null && amount !== "" ? Number(amount) : null,
    p_period_start: periodStart || null,
  });
  if (error) throw error;
  return data?.[0] ?? data;
}

// A monthly sponsorship is overdue when its due date has passed. The same
// definition the database uses (public.sponsorship_is_overdue), reimplemented
// here so the UI can flag a row without an extra round-trip per sponsorship.
export function isSponsorshipOverdue(sponsorship, now = new Date()) {
  if (!sponsorship) return false;
  if (sponsorship.status !== "active") return false;
  if (sponsorship.monthly_amount == null) return false;
  if (!sponsorship.next_payment_due) return false;
  // Compare calendar days: a donor isn't "overdue" at 00:01 on their due date.
  const due = new Date(sponsorship.next_payment_due);
  if (Number.isNaN(due.getTime())) return false;
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return dueDay < today;
}

// Matches on donor_id OR donor_email (case-insensitive) so donations show
// up even if only one of the two was recorded — e.g. older rows created
// before donor_id linking, or an email typed into Paystack with different
// casing than the account email.
export async function getDonorDonations(donorId, donorEmail) {
  try {
    const email = (donorEmail || "").toLowerCase();
    let query = supabase.from("donations").select("*");

    if (donorId && email) {
      query = query.or(`donor_id.eq.${donorId},donor_email.eq.${email}`);
    } else if (donorId) {
      query = query.eq("donor_id", donorId);
    } else if (email) {
      query = query.eq("donor_email", email);
    } else {
      return { data: [], error: null };
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getAllSponsorships() {
  try {
    const { data, error } = await supabase
      .from("sponsorships")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

// Admin monitoring view. Every sponsorship row carries the child it currently
// belongs to, plus the linked donation (amount actually paid), donor profile
// and — when the donor reused their credit to re-sponsor — the child they
// reassigned away from (previous_child_id) and when (reassigned_at).
//
// donor_id on sponsorships references auth.users(id) directly (not
// donor_profiles), so PostgREST can't auto-embed the donor profile. The
// profile/donation/child lookups are fetched separately and merged here, the
// same pattern used by services/users.js.
export async function getSponsorshipOverview() {
  try {
    const [
      { data: sponsorships, error: sponsorshipsError },
      { data: profiles, error: profilesError },
      { data: donations, error: donationsError },
      { data: children, error: childrenError },
    ] = await Promise.all([
      supabase
        .from("sponsorships")
        .select("*, children(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("donor_profiles")
        .select("id, first_name, last_name, email"),
      supabase
        .from("donations")
        .select(
          "id, donor_id, donor_name, donor_email, amount, currency, status, is_sponsorship, payment_reference, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase.from("children").select("id, first_name"),
    ]);

    for (const err of [sponsorshipsError, profilesError, donationsError, childrenError]) {
      if (err) return { data: null, error: err };
    }

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const donationMap = new Map((donations || []).map((d) => [d.id, d]));
    const childMap = new Map((children || []).map((c) => [c.id, c]));

    const data = (sponsorships || []).map((s) => ({
      ...s,
      donor: s.donor_id ? profileMap.get(s.donor_id) || null : null,
      donation: s.donation_id ? donationMap.get(s.donation_id) || null : null,
      previous_child: s.previous_child_id
        ? childMap.get(s.previous_child_id) || null
        : null,
    }));

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
