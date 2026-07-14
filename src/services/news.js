import supabase from "@/supabase/client";

export async function getNews() {
  try {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getAllNews() {
  try {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getNewsArticle(slug) {
  try {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("slug", slug)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function createArticle(articleData) {
  try {
    const { data, error } = await supabase
      .from("news")
      .insert(articleData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateArticle(id, articleData) {
  try {
    const { data, error } = await supabase
      .from("news")
      .update(articleData)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteArticle(id) {
  try {
    const { data, error } = await supabase
      .from("news")
      .delete()
      .eq("id", id);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
