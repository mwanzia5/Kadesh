import supabase from "@/supabase/client";

export async function getSponsorships(donorId) {
  try {
    const { data, error } = await supabase
      .from("sponsorships")
      .select("*, children(*)")
      .eq("donor_id", donorId)
      .order("created_at", { ascending: false });

    return { data, error };
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
