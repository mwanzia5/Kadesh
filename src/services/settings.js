import supabase from "@/supabase/client";

export async function getSetting(key) {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .single();

    return { data: data?.value ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getAllSettings() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*");

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateSetting(key, value) {
  try {
    const { data, error } = await supabase
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
