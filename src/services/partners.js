import supabase from "@/supabase/client";

export async function getPartners() {
  try {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getAllPartners() {
  try {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("sort_order", { ascending: true });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function createPartner(partnerData) {
  try {
    const { data, error } = await supabase
      .from("partners")
      .insert(partnerData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updatePartner(id, partnerData) {
  try {
    const { data, error } = await supabase
      .from("partners")
      .update(partnerData)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deletePartner(id) {
  try {
    const { data, error } = await supabase
      .from("partners")
      .delete()
      .eq("id", id);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
