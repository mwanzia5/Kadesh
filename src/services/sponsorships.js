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

export async function getDonorDonations(donorId) {
  try {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_id", donorId)
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
