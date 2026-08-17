// supabase/functions/verify-paystack-transaction/index.ts
//
// Called from the browser after Paystack's popup reports success. Re-verifies
// the transaction directly against Paystack's own servers (source of truth,
// not the client) before writing anything to the database. This closes two
// gaps in the old client-only flow:
//   1. A blocked/missed onSuccess callback in the browser (ad blockers,
//      extensions interfering with the popup's postMessage) no longer means
//      a real payment goes unrecorded — the frontend can call this function
//      any time it has a reference, even from a "did my payment go through?"
//      recovery flow.
//   2. The amount saved is whatever Paystack actually confirms was charged,
//      not whatever value was sitting in a client-side form field — this is
//      what makes fractional/typo amounts like "$0.0077" impossible to record
//      as if they were real, and prevents a tampered client from recording a
//      different (larger) amount than was actually paid.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      reference,
      donor_name,
      donor_email,
      donor_id,
      frequency,
      location,
      phone,
      sponsorship, // optional: { child_id, monthly_amount }
    } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing payment reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured for this function");
    }

    // 1. Ask Paystack directly whether this reference really succeeded.
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } }
    );
    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok || !verifyJson.status || verifyJson.data?.status !== "success") {
      return new Response(
        JSON.stringify({ error: "Payment could not be verified as successful", details: verifyJson }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const txn = verifyJson.data;
    const amountKES = txn.amount / 100; // Paystack returns subunits (kobo-equivalent)
    const meta = txn.metadata || {};

    // 2. Service role bypasses RLS — safe here because we only reach this
    //    point after independently confirming payment with Paystack.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Idempotency guard: if the frontend calls this twice for the same
    // reference (retry, double-click, page refresh), don't double-record.
    const { data: existing } = await supabase
      .from("donations")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyRecorded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_name: donor_name || meta.donor_name || null,
        donor_email: donor_email || txn.customer?.email || null,
        donor_id: donor_id || null,
        amount: meta.usd_equivalent ?? amountKES,
        currency: "KES",
        converted_amount: amountKES, // the amount Paystack actually confirms was charged
        frequency: frequency || meta.frequency || "one-time",
        status: "completed",
        payment_reference: reference,
        location: location || meta.location || null,
        phone: phone || meta.phone || null,
      })
      .select()
      .single();

    if (donationError) throw donationError;

    // 3. Optional sponsorship linkage — same trusted, server-verified write.
    if (sponsorship?.child_id && donor_id) {
      const { error: sponsorshipError } = await supabase.from("sponsorships").insert({
        donor_id,
        child_id: sponsorship.child_id,
        status: "active",
        monthly_amount: sponsorship.monthly_amount ?? null,
      });
      if (sponsorshipError) throw sponsorshipError;

      const { error: childError } = await supabase
        .from("children")
        .update({ sponsorship_status: "sponsored" })
        .eq("id", sponsorship.child_id);
      if (childError) throw childError;
    }

    return new Response(JSON.stringify({ success: true, donation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify-paystack-transaction error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});