import supabase from "@/supabase/client";

export async function getVideos(category) {
  try {
    let query = supabase
      .from("videos")
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

export async function getFeaturedVideos() {
  try {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("is_featured", true)
      .order("sort_order", { ascending: true });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function createVideo(videoData) {
  try {
    const { data, error } = await supabase
      .from("videos")
      .insert(videoData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateVideo(id, videoData) {
  try {
    const { data, error } = await supabase
      .from("videos")
      .update(videoData)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteVideo(id) {
  try {
    const { data, error } = await supabase
      .from("videos")
      .delete()
      .eq("id", id);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
