import supabase from "@/supabase/client";

export async function getDonorProfiles() {
  const { data, error } = await supabase
    .from("donor_profiles")
    .select("*, sponsorships:sponsorships(donor_id)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
