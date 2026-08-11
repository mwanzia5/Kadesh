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
    const { error } = await supabase
      .from("contact_messages")
      .insert(messageData);

    if (error) {
      console.error("[sendMessage] Supabase insert error:", error);
      return { data: null, error };
    }

    supabase.functions
      .invoke("notify-contact", { body: messageData })
      .catch((notifyErr) => {
        console.error("[sendMessage] notify-contact invoke error:", notifyErr);
      });

    return { data: true, error: null };
  } catch (err) {
    console.error("[sendMessage] Unexpected error:", err);
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