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

export async function createSponsorship(sponsorshipData) {
  try {
    const { data, error } = await supabase
      .from("sponsorships")
      .insert(sponsorshipData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateSponsorship(id, sponsorshipData) {
  try {
    const { data, error } = await supabase
      .from("sponsorships")
      .update(sponsorshipData)
      .eq("id", id)
      .select()
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

// Sponsors a child using an existing, already-paid sponsorship credit (no new
// payment). Reuses the donor's oldest cancelled sponsorship slot. `amount` is
// an optional sponsorship amount to record on the slot. `plan` optionally
// sets it to 'one-time' or 'monthly' (default preserves the slot's plan).
// Throws if the donor has no cancelled sponsorship to draw from.
export async function sponsorWithCredit({ childId, amount, plan }) {
  const { data, error } = await supabase.rpc("create_sponsorship_with_credit", {
    p_child_id: childId,
    p_amount: amount || null,
    p_plan: plan || null,
  });
  if (error) throw error;
  return data;
}

// Reactivates a cancelled sponsorship (sets it back to "active"). The trigger
// flips the child back to "sponsored". Enforces the same one-active-per-
// donation rule server-side. `plan` optionally switches the plan to 'one-time'
// or 'monthly' (default keeps the slot's current plan). Throws if there is no
// available credit.
export async function reactivateSponsorship(sponsorshipId, plan) {
  const { data, error } = await supabase.rpc("reactivate_sponsorship", {
    p_sponsorship_id: sponsorshipId,
    p_plan: plan || null,
  });
  if (error) throw error;
  return data;
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
