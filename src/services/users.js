import supabase from "@/supabase/client";

export async function getDonorProfiles() {
  // donor_profiles.id and sponsorships.donor_id both reference auth.users(id)
  // directly, not each other — there's no FK from sponsorships to
  // donor_profiles for PostgREST to auto-join on, so a nested embed like
  // `.select("*, sponsorships:sponsorships(donor_id)")` fails to resolve.
  // Fetch both tables separately and merge here instead.
  const [{ data: profiles, error: profilesError }, { data: sponsorships, error: sponsorshipsError }] =
    await Promise.all([
      supabase
        .from("donor_profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("sponsorships")
        .select("id, donor_id, child_id, status, monthly_amount"),
    ]);

  if (profilesError) throw profilesError;
  if (sponsorshipsError) throw sponsorshipsError;

  const sponsorshipsByDonor = new Map();
  for (const s of sponsorships || []) {
    if (!sponsorshipsByDonor.has(s.donor_id)) {
      sponsorshipsByDonor.set(s.donor_id, []);
    }
    sponsorshipsByDonor.get(s.donor_id).push(s);
  }

  return (profiles || []).map((profile) => ({
    ...profile,
    sponsorships: sponsorshipsByDonor.get(profile.id) || [],
  }));
}