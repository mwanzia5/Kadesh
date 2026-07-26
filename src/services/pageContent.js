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

// NEW — fetches every page's content in one call, so the admin
// tab list can show a "has custom content" dot per page without
// firing a query per tab.
export async function getAllPageContent() {
  try {
    const { data, error } = await supabase
      .from("page_content")
      .select("*");

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

// NEW — powers "Reset page to defaults": deletes every override
// row for a given page so the hardcoded defaults show again.
export async function resetPageContent(pageSlug) {
  try {
    const { data, error } = await supabase
      .from("page_content")
      .delete()
      .eq("page_slug", pageSlug);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}