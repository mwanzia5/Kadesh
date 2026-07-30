import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const NOTIFICATION_EMAIL = "kadeshhope.africa@gmail.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Must be an address on a domain verified in Resend.
// Change the local part (before the @) to whatever you prefer —
// e.g. "hello@" or "no-reply@" — but keep the domain exactly as verified.
const FROM_ADDRESS = "Kadesh Hope Mission <noreply@contact.kadeshhopemission.org>";

interface ContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  subject?: string;
  message: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error("[notify-contact] RESEND_API_KEY is not set");
    return new Response(
      JSON.stringify({ success: false, error: "Server misconfiguration: missing RESEND_API_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.text();

    if (!body) {
      return new Response(
        JSON.stringify({ success: false, error: "No body provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let payload: ContactPayload;
    let recordId: string | undefined;

    // Check if this is a Supabase database webhook payload
    if (req.headers.get("x-supabase-event") === "INSERT") {
      const data = JSON.parse(body);
      const record = data.record;
      recordId = record.id;
      payload = {
        first_name: record.first_name,
        last_name: record.last_name,
        email: record.email,
        subject: record.subject,
        message: record.message,
      };
    } else {
      payload = JSON.parse(body);
    }

    const { first_name, last_name, email, subject, message } = payload;

    if (!email || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeFirstName = escapeHtml(first_name);
    const safeLastName = escapeHtml(last_name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "N/A");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [NOTIFICATION_EMAIL],
        reply_to: email,
        subject: `New Contact: ${subject || "General Inquiry"} \u2014 ${first_name} ${last_name}`,
        html: `
          <h2>New Contact Form Message</h2>
          <p><strong>From:</strong> ${safeFirstName} ${safeLastName} (${safeEmail})</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #ccc; padding-left:12px; margin-left:0;">
            ${safeMessage}
          </blockquote>
          ${recordId ? `<p style="color:#999; font-size:12px;">Record ID: ${escapeHtml(recordId)}</p>` : ""}
        `,
      }),
    });

    let result: unknown;
    try {
      result = await resendResponse.json();
    } catch {
      result = { raw: await resendResponse.text().catch(() => "") };
    }

    if (!resendResponse.ok) {
      throw new Error(`Resend error (${resendResponse.status}): ${JSON.stringify(result)}`);
    }

    return new Response(
      JSON.stringify({ success: true, id: (result as { id?: string }).id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[notify-contact] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});