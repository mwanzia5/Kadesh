import supabase from "@/supabase/client";

// Embeds the sponsorship_payments links (migration 005) so a donation can name
// the child(ren) it actually funded. is_sponsorship is derived from those same
// links by the database, so the label and the child name cannot disagree.
//
// That table does not exist until 005 is applied to a given database, and
// PostgREST rejects the WHOLE query when an embedded relation is missing — which
// previously surfaced as an empty donations table rather than an error. So probe
// once, remember the answer, and fall back to a plain select if the links table
// isn't there yet. The capability is cached in module scope so this costs at
// most one extra request per session rather than one per fetch.
const DONATIONS_WITH_LINKS =
  "*, sponsorship_payments(kind, amount, sponsorships(id, child_id, status, children(id, first_name)))";

let linksTableAvailable = null;

function isMissingLinksTable(error) {
  const text = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`;
  return /PGRST200|does not exist|not found|schema cache/i.test(text);
}

export async function selectDonations(query) {
  if (linksTableAvailable === false) return query.select("*");
  const { data, error } = await query.select(DONATIONS_WITH_LINKS);
  if (!error) {
    linksTableAvailable = true;
    return { data, error: null };
  }
  if (!isMissingLinksTable(error)) return { data, error };
  linksTableAvailable = false;
  const fallback = await query.select("*");
  if (fallback.error) return fallback;
  return fallback;
}

export const donationsService = {
  async create(donation) {
    const { data, error } = await supabase
      .from("donations")
      .insert(donation)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const result = await selectDonations(
      supabase.from("donations").order("created_at", { ascending: false })
    );
    if (result.error) throw result.error;
    return result.data;
  },

  async getByDonorEmail(email) {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_email", email)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getStats() {
    const { data, error } = await supabase
      .from("donations")
      .select("amount, currency, status, created_at");
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from("donations")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Admin-only reconciliation: pulls recent successful transactions straight
  // from Paystack and imports any that are missing from the table (e.g. if
  // both the browser verify call and the webhook failed for a donation).
  async syncFromPaystack() {
    const { data, error } = await supabase.functions.invoke("sync-paystack-transactions");
    if (error) throw error;
    return data;
  },
};
