import supabase from "@/supabase/client";

export async function getMessages() {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function sendMessage(messageData) {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .insert(messageData)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function markAsRead(id) {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function markAsUnread(id) {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .update({ is_read: false })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteMessage(id) {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
