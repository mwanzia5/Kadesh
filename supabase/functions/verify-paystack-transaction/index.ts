// supabase/functions/verify-paystack-transaction/index.ts
//
// Called from the browser right after Paystack's popup reports success.
// Re-verifies the transaction against Paystack's own servers before writing
// anything. Sponsorship-relevant fields (donor_id, is_sponsorship, child_id,
// monthly_amount) are STILL only ever trusted from Paystack's verified
// metadata, never from the client body below — those affect who gets
// enrolled as a sponsor, so they can't be spoofed by editing the request.
//
// donor_name / location / phone are display-only, not security-relevant, so
// as a reliability fallback this endpoint also accepts them directly from
// the browser (the same values the donor just typed into the form) and uses
// them if Paystack's metadata came back empty for any reason. This also
// covers the case where paystack-webhook won the race and inserted the row
// first with blanks — this call will patch them in afterwards.
//
// The paystack-webhook function is still the reliability backstop for
// recording the donation at all (closed tab, crashed browser, network
// drop) — it just won't have a client fallback to draw on, since Paystack
// calls it server-to-server with no access to the browser's form state.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { recordVerifiedTransaction } from "../_shared/record-verified-transaction.js";

async function verifyWithPaystack(reference: string, secret: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } }
  );
  const json = await res.json();
  if (!res.ok || !json.status || json.data?.status !== "success") {
    // Never echo Paystack's response: it contains the payer's details.
    throw { httpStatus: 402, body: { error: "Payment could not be verified as successful" } };
  }
  return json.data;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { reference, donor_name, location, phone } = body;
    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing payment reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

    const txn = await verifyWithPaystack(reference, paystackSecret);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const result = await recordVerifiedTransaction(txn, supabase, { donor_name, location, phone });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    if (err?.httpStatus) {
      return new Response(JSON.stringify(err.body), {
        status: err.httpStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("verify-paystack-transaction error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});