// supabase/functions/verify-paystack-transaction/index.ts
//
// Called from the browser right after Paystack's popup reports success.
// Re-verifies the transaction against Paystack's own servers before writing
// anything — the client only ever sends a reference, never donor/sponsorship
// details, since those are read from Paystack's verified metadata instead.
// This is the "fast path": if the donor's browser is still around right
// after paying, this records the donation immediately. The paystack-webhook
// function is the backstop that guarantees recording even if this call never
// happens (closed tab, crashed browser, network drop).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

async function verifyWithPaystack(reference: string, secret: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } }
  );
  const json = await res.json();
  if (!res.ok || !json.status || json.data?.status !== "success") {
    throw { httpStatus: 402, body: { error: "Payment could not be verified as successful", details: json } };
  }
  return json.data;
}

export async function recordVerifiedTransaction(txn: any, supabase: ReturnType<typeof createClient>) {
  const amountKES = txn.amount / 100; // Paystack returns subunits
  const meta = txn.metadata || {};

  // Conflict-safe insert: relies on the UNIQUE constraint on
  // donations.payment_reference (see migration) so a race between this
  // function and the webhook can never create duplicate rows.
  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .insert({
      donor_name: meta.donor_name || null,
      donor_email: txn.customer?.email || null,
      donor_id: meta.donor_id || null,
      amount: meta.usd_equivalent ?? amountKES,
      currency: "KES",
      converted_amount: amountKES,
      frequency: meta.frequency || "one-time",
      status: "completed",
      payment_reference: txn.reference,
      location: meta.location || null,
      phone: meta.phone || null,
    })
    .select()
    .single();

  // 23505 = unique_violation — another caller (webhook or a duplicate
  // client call) already recorded this reference. Not an error condition.
  if (donationError && donationError.code !== "23505") throw donationError;

  const alreadyRecorded = donationError?.code === "23505";

  // Sponsorship intent comes from Paystack's own metadata, not the client
  // request body — this can't be spoofed to attach an unpaid child, since
  // it's the same metadata that was verified as part of the transaction.
  if (!alreadyRecorded && meta.is_sponsorship && meta.child_id && meta.donor_id) {
    const { data: existingSponsorship } = await supabase
      .from("sponsorships")
      .select("id")
      .eq("donor_id", meta.donor_id)
      .eq("child_id", meta.child_id)
      .maybeSingle();

    if (!existingSponsorship) {
      const { error: sponsorshipError } = await supabase.from("sponsorships").insert({
        donor_id: meta.donor_id,
        child_id: meta.child_id,
        status: "active",
        monthly_amount: meta.monthly_amount ?? null,
      });
      if (sponsorshipError) throw sponsorshipError;

      const { error: childError } = await supabase
        .from("children")
        .update({ sponsorship_status: "sponsored" })
        .eq("id", meta.child_id);
      if (childError) throw childError;
    }
  }

  return { donation, alreadyRecorded };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();
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

    const result = await recordVerifiedTransaction(txn, supabase);

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