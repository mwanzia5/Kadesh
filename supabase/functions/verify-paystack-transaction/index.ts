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
import { getRates, rateFor, toUSD } from "../_shared/fx.ts";

const round2 = (n: number) => Math.round(n * 100) / 100;
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

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
  // Paystack is the authority on what was actually charged: it reports in
  // subunits of the account currency (KES), so this is the real money the
  // donor parted with. Everything else is derived from it.
  const amountKES = txn.amount / 100;
  const chargedCurrency = (txn.currency || "KES").toUpperCase();
  const meta = txn.metadata || {};

  // Convert the charged amount to USD at a live rate, and keep that rate.
  //
  // The donor's chosen display currency is irrelevant to the maths: they may
  // have picked INR, but the card was charged KES, so the KES figure is what
  // gets converted. The rate is snapshotted onto the row so a later market move
  // never restates what this gift was worth.
  const { rates, source: fxSource, live: fxLive } = await getRates();
  const usdAmount = round2(toUSD(amountKES, chargedCurrency, rates));
  const fxRate = round6(rateFor(rates, chargedCurrency));
  // If a live lookup failed we still record the rate we applied, but flag the
  // source so a wrong figure can be traced and corrected later.
  const fxRateSource = fxLive ? fxSource : "static-fallback";

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
      // Reporting currency is USD, converted live from what Paystack charged.
      // The browser's usd_equivalent is deliberately ignored: it was computed
      // from a possibly stale rate and trusting it is what let the old
      // hardcoded-rate drift reach the books in the first place.
      amount: usdAmount,
      usd_amount: usdAmount,
      currency: "USD",
      // What was really charged, kept alongside the USD figure.
      amount_original: amountKES,
      charged_currency: chargedCurrency,
      converted_amount: amountKES,
      fx_rate: fxRate,
      fx_rate_source: fxRateSource,
      frequency: meta.frequency || "one-time",
      status: "completed",
      // Intentionally NOT set from meta.is_sponsorship. The sponsorship
      // classification is derived by the database from the
      // sponsorship_payments links written below (migration 005), so a client
      // claim can't mark a general donation as a child sponsorship, and a
      // sponsorship whose insert fails can't leave the money misfiled.
      // The trigger on donations reconciles the flag from existing links, so
      // this insert may briefly carry false and be corrected immediately.
      is_sponsorship: false,
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
  // Set below when the row already existed, so a renewal can still be linked
  // to the payment that covered it.
  let alreadyRecordedDonationId: string | null = null;
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

    // Fetch the existing row so a renewal retry can still link the sponsorship
    // to the payment that covered it, even though this call didn't insert it.
    const { data: existing } = await supabase
      .from("donations")
      .select("id")
      .eq("payment_reference", txn.reference)
      .maybeSingle();
    alreadyRecordedDonationId = existing?.id ?? null;
  }

  // Sponsorship intent comes from Paystack's own metadata, not the client
  // request body — this can't be spoofed to attach an unpaid child, since
  // it's the same metadata that was verified as part of the transaction.
  // A single payment may sponsor several children (cart checkout): each child
  // in `metadata.children` gets its own sponsorship row linked to the same
  // payment. Single-child flows (`metadata.child_id`) are still supported.
  const sponsorshipChildren: {
    child_id: string;
    amount: number | null;
    monthly_amount: number | null;
    renew: boolean;
  }[] = Array.isArray(meta.children) && meta.children.length > 0
    ? meta.children
    : meta.is_sponsorship && meta.donor_id
      ? meta.renew_sponsorship_id
        ? // A renewal payment: it tops up an existing monthly sponsorship
          // rather than enrolling a new child, so it is matched by sponsorship
          // id below instead of by child.
          []
        : meta.child_id
          ? [{
              child_id: meta.child_id,
              amount: usdAmount,
              monthly_amount: meta.monthly_amount ?? null,
              renew: false,
            }]
          : []
      : [];

  // Renewal path: the donor paid to keep an existing monthly sponsorship
  // going. Advance its billing period so it stops showing as overdue, and
  // re-activate the child if the sponsorship had been paused.
  //
  // The sponsorship id comes from Paystack's verified metadata, and the RPC
  // re-checks the payment against the sponsorship's donor, so a donor cannot
  // renew (and thereby unlock) somebody else's child by editing the request.
  //
  // This runs whether or not this call was the one that inserted the row: if
  // the webhook recorded the payment and then died before advancing the
  // period, the donor's browser callback is the retry that repairs it. The RPC
  // is idempotent (an already-current period is a no-op), so running it from
  // both paths can't push the cycle out twice.
  if (meta.renew_sponsorship_id) {
    const { data: advanced, error: advanceError } = await supabase.rpc(
      "advance_monthly_period",
      {
        p_sponsorship_id: meta.renew_sponsorship_id,
        p_payment_reference: txn.reference,
      }
    );
    if (advanceError) {
      // Don't fail the whole verification over the period bump — the money is
      // already recorded. Surface it so the sync can repair it later.
      console.error("Failed to advance monthly period:", advanceError);
    } else if (advanced?.child_id) {
      // Keep the child marked as sponsored for the new period.
      await supabase
        .from("children")
        .update({ sponsorship_status: "sponsored" })
        .eq("id", advanced.child_id);
    }

    // Record which payment covered which period. This is a link row rather
    // than the old sponsorships.donation_id UPDATE, which could only ever hold
    // one payment: a second renewal overwrote the first, destroying the
    // per-payment trail. ON CONFLICT keeps the webhook and the browser
    // callback from double-writing the same link.
    const renewalDonationId = donation?.id ?? alreadyRecordedDonationId;
    if (advanced?.id && renewalDonationId) {
      const { error: linkError } = await supabase
        .from("sponsorship_payments")
        .upsert(
          {
            sponsorship_id: advanced.id,
            donation_id: renewalDonationId,
            kind: "renewal",
            amount: usdAmount,
          },
          { onConflict: "donation_id,sponsorship_id", ignoreDuplicates: true }
        );
      if (linkError) {
        // The payment is already recorded and the period already advanced, so
        // don't fail verification — but the classification depends on this
        // link, so surface it loudly for the sync to repair.
        console.error("Failed to link renewal payment:", linkError);
      }
    }
  }

  if (!alreadyRecorded && meta.donor_id) {
    for (const item of sponsorshipChildren) {
      const { data: existingSponsorship } = await supabase
        .from("sponsorships")
        .select("id")
        .eq("donor_id", meta.donor_id)
        .eq("child_id", item.child_id)
        .eq("status", "active")
        .maybeSingle();

      if (!existingSponsorship) {
        // A brand-new monthly sponsorship is paid for the month that starts
        // today, so its first period runs from now until one calendar month
        // from now and the next payment falls due then.
        const periodStart = new Date();
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const { data: createdSponsorship, error: sponsorshipError } = await supabase
          .from("sponsorships")
          .insert({
            donor_id: meta.donor_id,
            child_id: item.child_id,
            status: "active",
            monthly_amount: Number(item.monthly_amount) || null,
            amount: Number(item.amount) || null,
            donation_id: donation?.id ?? null,
            ...(Number(item.monthly_amount)
              ? {
                  current_period_start: periodStart.toISOString(),
                  current_period_end: periodEnd.toISOString(),
                  next_payment_due: periodEnd.toISOString(),
                }
              : {}),
          })
          .select("id")
          .single();
        if (sponsorshipError) throw sponsorshipError;

        // The link is what makes this payment a child sponsorship: the
        // donations trigger derives is_sponsorship from its existence, so the
        // books cannot say "sponsorship" without a sponsorship to point at.
        if (createdSponsorship?.id && donation?.id) {
          const { error: linkError } = await supabase
            .from("sponsorship_payments")
            .upsert(
              {
                sponsorship_id: createdSponsorship.id,
                donation_id: donation.id,
                kind: "initial",
                amount: Number(item.amount) || usdAmount,
              },
              { onConflict: "donation_id,sponsorship_id", ignoreDuplicates: true }
            );
          if (linkError) throw linkError;
        }

        const { error: childError } = await supabase
          .from("children")
          .update({ sponsorship_status: "sponsored" })
          .eq("id", item.child_id);
        if (childError) throw childError;
      } else if (existingSponsorship?.id && donation?.id) {
        // The donor already sponsors this child actively, so no new
        // sponsorship row is created — but the payment still funded that
        // sponsorship, so it must be linked. Without this, a repeat payment
        // for an already-sponsored child would be recorded as a general
        // donation, which is exactly the misclassification this migration
        // exists to remove. Kind is 'renewal' because the sponsorship already
        // existed; the period advance is handled by the renew_sponsorship_id
        // path above.
        const { error: topUpLinkError } = await supabase
          .from("sponsorship_payments")
          .upsert(
            {
              sponsorship_id: existingSponsorship.id,
              donation_id: donation.id,
              kind: "renewal",
              amount: Number(item.amount) || usdAmount,
            },
            { onConflict: "donation_id,sponsorship_id", ignoreDuplicates: true }
          );
        if (topUpLinkError) throw topUpLinkError;
      }
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