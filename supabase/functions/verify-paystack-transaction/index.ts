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

type ClientFallback = {
  donor_name?: string | null;
  location?: string | null;
  phone?: string | null;
};

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

export async function recordVerifiedTransaction(
  txn: any,
  supabase: ReturnType<typeof createClient>,
  clientFallback: ClientFallback = {}
) {
  const amountKES = txn.amount / 100; // Paystack returns subunits
  const meta = txn.metadata || {};

  // Prefer Paystack's verified metadata; fall back to what the browser sent
  // directly if metadata came back empty for these display-only fields.
  const donorName = meta.donor_name || clientFallback.donor_name || null;
  const location = meta.location || clientFallback.location || null;
  const phone = meta.phone || clientFallback.phone || null;
  // Lowercased so the "view own donations" RLS policy (which compares
  // against auth.email()) matches no matter what case the donor typed
  // into the Paystack popup.
  const donorEmail = (txn.customer?.email || "").toLowerCase() || null;

  // Conflict-safe insert: relies on the UNIQUE constraint on
  // donations.payment_reference (see migration) so a race between this
  // function and the webhook can never create duplicate rows.
  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .insert({
      donor_name: donorName,
      donor_email: donorEmail,
      donor_id: meta.donor_id || null,
      amount: meta.usd_equivalent ?? amountKES,
      currency: "KES",
      converted_amount: amountKES,
      frequency: meta.frequency || "one-time",
      status: "completed",
      is_sponsorship: !!meta.is_sponsorship,
      payment_reference: txn.reference,
      location,
      phone,
    })
    .select()
    .single();

  // 23505 = unique_violation — another caller (webhook or a duplicate
  // client call) already recorded this reference. Not an error condition,
  // but if we have donor details this call's caller didn't, patch them in
  // rather than leaving the row permanently blank.
  const alreadyRecorded = donationError?.code === "23505";
  if (donationError && !alreadyRecorded) throw donationError;

  if (alreadyRecorded) {
    const patch: Record<string, string> = {};
    if (donorName) patch.donor_name = donorName;
    if (location) patch.location = location;
    if (phone) patch.phone = phone;
    // Also link the row to the donor's account. Without this, a donation
    // the webhook recorded first (e.g. with blank metadata) would never
    // appear in the donor's dashboard.
    if (meta.donor_id) patch.donor_id = meta.donor_id;
    if (donorEmail) patch.donor_email = donorEmail;

    if (Object.keys(patch).length > 0) {
      const { error: patchError } = await supabase
        .from("donations")
        .update(patch)
        .eq("payment_reference", txn.reference)
        .or(
          "donor_name.is.null,donor_id.is.null,donor_email.is.null,location.is.null,phone.is.null"
        );
      if (patchError) console.error("Backfill of donor details failed:", patchError);
    }
  }

  // Sponsorship intent comes from Paystack's own metadata, not the client
  // request body — this can't be spoofed to attach an unpaid child, since
  // it's the same metadata that was verified as part of the transaction.
  if (!alreadyRecorded && meta.is_sponsorship && meta.child_id && meta.donor_id) {
    const { data: existingSponsorship } = await supabase
      .from("sponsorships")
      .select("id")
      .eq("donor_id", meta.donor_id)
      .eq("child_id", meta.child_id)
      .eq("status", "active")
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