import supabase from "@/supabase/client";

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
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
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
