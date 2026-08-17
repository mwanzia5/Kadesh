import supabase from "@/supabase/client";

export async function getMessages() {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function sendMessage(message) {
  const { data, error } = await supabase
    .from("contact_messages")
    .insert(message)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markAsRead(id) {
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markAsUnread(id) {
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ is_read: false })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMessage(id) {
  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return id;
}

// Generic patch — covers admin edits to a message record beyond the
// dedicated read/unread helpers above (e.g. correcting a typo'd email).
export async function updateMessage({ id, data: patch }) {
  const { data, error } = await supabase
    .from("contact_messages")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Sends the admin's reply to the donor's email via the reply-to-contact
// Edge Function (mirrors the notify-contact function already used for
// inbound messages), then records the reply text + timestamp on the row so
// the admin panel can show reply history without re-sending mail.
export async function replyToMessage({ id, reply }) {
  const message = await supabase
    .from("contact_messages")
    .select("email, first_name, last_name, subject")
    .eq("id", id)
    .single();

  if (message.error) throw message.error;

  const { error: sendError } = await supabase.functions.invoke("reply-to-contact", {
    body: {
      to: message.data.email,
      donor_name: [message.data.first_name, message.data.last_name].filter(Boolean).join(" "),
      original_subject: message.data.subject,
      reply,
    },
  });
  if (sendError) throw sendError;

  const { data, error } = await supabase
    .from("contact_messages")
    .update({ reply, replied_at: new Date().toISOString(), is_read: true })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}