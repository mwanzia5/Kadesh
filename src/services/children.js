import supabase from "@/supabase/client";

// Signed-out visitors may only see a child's photo (plus the id and
// availability needed to show the card). Every other column — name, age,
// location, school, family and story — is for signed-in donors only. The
// database enforces the same split (supabase/child-privacy.sql), so these are
// the only columns an anonymous request is allowed to read.
export const PUBLIC_CHILD_COLUMNS =
  "id, photo_url, sponsorship_status, created_at";

export async function getChildren({ publicOnly = false } = {}) {
  try {
    const { data, error } = await supabase
      .from("children")
      .select(publicOnly ? PUBLIC_CHILD_COLUMNS : "*")
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getChild(id, { publicOnly = false } = {}) {
  try {
    const { data, error } = await supabase
      .from("children")
      .select(publicOnly ? PUBLIC_CHILD_COLUMNS : "*")
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
  const { data, error } = await supabase
    .from("children")
    .insert(childData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChild(id, childData) {
  const { data, error } = await supabase
    .from("children")
    .update(childData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChild(id) {
  const { data, error } = await supabase
    .from("children")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return data;
}
