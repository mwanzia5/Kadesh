import supabase from "@/supabase/client";

export async function getTestimonials() {
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function createTestimonial(testimonialData) {
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .insert(testimonialData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateTestimonial(id, testimonialData) {
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .update(testimonialData)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteTestimonial(id) {
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
