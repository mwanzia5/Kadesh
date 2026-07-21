import supabase from "@/supabase/client";

export async function getChildren() {
  try {
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getChild(id) {
  try {
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getAvailableChildren() {
  try {
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("sponsorship_status", "available")
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function createChild(childData) {
  try {
    const { data, error } = await supabase
      .from("children")
      .insert(childData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateChild(id, childData) {
  try {
    const { data, error } = await supabase
      .from("children")
      .update(childData)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteChild(id) {
  try {
    const { data, error } = await supabase
      .from("children")
      .delete()
      .eq("id", id);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
