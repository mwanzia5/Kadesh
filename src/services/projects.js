import supabase from "@/supabase/client";

export async function getProjects() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getProject(slug) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getFeaturedProjects() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_featured", true)
      .order("sort_order", { ascending: true });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function createProject(projectData) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateProject(id, projectData) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteProject(id) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
