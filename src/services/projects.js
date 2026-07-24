import supabase from "@/supabase/client";

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return { data };
}

export async function getProject(slug) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return { data };
}

export async function getFeaturedProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_featured", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return { data };
}

export async function createProject(projectData) {
  const { data, error } = await supabase
    .from("projects")
    .insert(projectData)
    .select()
    .single();

  if (error) throw error;
  return { data };
}

export async function updateProject(id, projectData) {
  const { data, error } = await supabase
    .from("projects")
    .update(projectData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data };
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return { success: true };
}
