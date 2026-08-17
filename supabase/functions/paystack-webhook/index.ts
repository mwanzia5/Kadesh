// supabase/functions/paystack-webhook/index.ts
//
// This is the reliability backstop. Paystack calls THIS endpoint directly,
// server-to-server, the moment a charge succeeds — completely independent of
// whether the donor's browser is still open, whether their connection drops,
// or whether an ad blocker interfered with the popup's callback. As long as
// the charge succeeded on Paystack's side, this endpoint will eventually
// record it, even if the donor closed the tab the instant they paid.
//
// IMPORTANT — deployment requires disabling Supabase's default JWT check,
// since Paystack does not (and cannot) send a Supabase auth token:
//   supabase functions deploy paystack-webhook --no-verify-jwt
//
// Then register this function's URL in the Paystack dashboard under
// Settings → API Keys & Webhooks → Webhook URL:
//   https://<project-ref>.supabase.co/functions/v1/paystack-webhook

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { recordVerifiedTransaction } from "../verify-paystack-transaction/index.ts";

// Paystack signs the raw request body with your secret key (HMAC-SHA512) and
// sends the hex digest in the x-paystack-signature header. Verifying this is
// what proves the request genuinely came from Paystack and not an attacker
// hitting this public URL directly to fabricate a fake "successful" donation.
async function isValidSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secret) {
    console.error("PAYSTACK_SECRET_KEY is not configured");
    return new Response("Server misconfigured", { status: 500 });
  }

  // Must read as raw text BEFORE parsing — signature verification needs the
  // exact bytes Paystack signed, not a re-serialized JSON.parse() round trip.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!(await isValidSignature(rawBody, signature, secret))) {
    console.warn("Rejected webhook call with invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Only act on successful charges — Paystack sends many other event types
  // (transfer events, subscription events, etc.) to the same webhook URL.
  if (event.event !== "charge.success") {
    return new Response(JSON.stringify({ received: true, ignored: event.event }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // event.data has the same shape as the /transaction/verify response used
    // by verify-paystack-transaction, so the exact same recording logic
    // (including the idempotent unique-constraint insert) applies here too.
    await recordVerifiedTransaction(event.data, supabase);

    // Paystack expects a fast 2xx response; it retries on non-2xx/timeout.
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("paystack-webhook processing error:", err);
    // Return 500 so Paystack retries this webhook later rather than silently
    // dropping a real payment because of a transient DB error.
    return new Response(JSON.stringify({ error: "Processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});