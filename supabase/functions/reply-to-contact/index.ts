const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// The project secret was created under the name "RESEND"; accept either name.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("RESEND");

// Must be an address on a domain verified in Resend.
const FROM_ADDRESS = "Kadesh Hope Mission <noreply@contact.kadeshhopemission.org>";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error("[reply-to-contact] RESEND_API_KEY is not set");
    return new Response(
      JSON.stringify({ success: false, error: "Server misconfiguration: missing RESEND_API_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { to, donor_name, original_subject, reply } = await req.json();

    if (!to || !reply) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, reply" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeName = escapeHtml(donor_name || to);
    const safeSubject = escapeHtml(original_subject || "your message");
    // Plain-text reply rendered safely: preserve line breaks, escape HTML.
    const safeReply = escapeHtml(reply).replace(/\n/g, "<br>");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject: `Re: ${original_subject || "Your message to Kadesh Hope Mission"}`,
        html: `
          <p>Hi ${safeName},</p>
          <p>Thank you for reaching out to Kadesh Hope Mission. Here is our reply to
          <strong>${safeSubject}</strong>:</p>
          <blockquote style="border-left:3px solid #ccc; padding-left:12px; margin-left:0;">
            ${safeReply}
          </blockquote>
          <p>Blessings,<br/>
          Kadesh Hope Mission Team</p>
          <hr style="border:none;border-top:1px solid #eee;margin-top:24px;" />
          <p style="color:#999; font-size:12px;">This message was sent in reply to a message
          you submitted through the Kadesh Hope Mission website.</p>
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
    console.error("[reply-to-contact] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
