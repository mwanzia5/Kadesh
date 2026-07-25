import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTIFICATION_EMAIL = "kadeshhope.africa@gmail.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

interface ContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  subject?: string;
  message: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kadesh Hope Website <onboarding@resend.dev>",
        to: [NOTIFICATION_EMAIL],
        reply_to: email,
        subject: `New Contact: ${subject || "General Inquiry"} — ${first_name} ${last_name}`,
        html: `
          <h2>New Contact Form Message</h2>
          <p><strong>From:</strong> ${first_name} ${last_name} (${email})</p>
          <p><strong>Subject:</strong> ${subject || "N/A"}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #ccc; padding-left:12px; margin-left:0;">
            ${message.replace(/\n/g, "<br>")}
          </blockquote>
          ${recordId ? `<p style="color:#999; font-size:12px;">Record ID: ${recordId}</p>` : ""}
        `,
      }),
    });

    const result = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Resend error: ${JSON.stringify(result)}`);
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
