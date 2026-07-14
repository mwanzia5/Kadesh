import supabase from "@/supabase/client";

export async function getGalleryImages(category) {
  try {
    let query = supabase
      .from("gallery")
      .select("*")
      .order("sort_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getGalleryImage(id) {
  try {
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function createGalleryImage(imageData) {
  try {
    const { data, error } = await supabase
      .from("gallery")
      .insert(imageData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteGalleryImage(id) {
  try {
    const { data, error } = await supabase
      .from("gallery")
      .delete()
      .eq("id", id);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
