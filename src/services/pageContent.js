import supabase from "@/supabase/client";

export async function getPageContent(pageSlug) {
  try {
    const { data, error } = await supabase
      .from("page_content")
      .select("*")
      .eq("page_slug", pageSlug);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updatePageContent(pageSlug, sectionKey, content) {
  try {
    const { data, error } = await supabase
      .from("page_content")
      .upsert(
        {
          page_slug: pageSlug,
          section_key: sectionKey,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page_slug,section_key" },
      )
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
