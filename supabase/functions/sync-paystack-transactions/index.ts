import { createClient } from "npm:@supabase/supabase-js@2";
import { getRates, rateFor, toUSD } from "../_shared/fx.ts";

const round2 = (n: number) => Math.round(n * 100) / 100;
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Same allowlist as the is_admin() SQL helper in migrations.sql.
const ADMIN_EMAILS = ["masooshem@gmail.com", "kadeshhope.africa@gmail.com"];

// Self-contained copy of recordVerifiedTransaction (kept in sync with
// verify-paystack-transaction) so this function deploys as a single file.
async function recordVerifiedTransaction(
  txn: any,
  supabase: ReturnType<typeof createClient>
) {
  // Paystack is the authority on what was charged (subunits of KES).
  const amountKES = txn.amount / 100;
  const chargedCurrency = (txn.currency || "KES").toUpperCase();
  const meta = txn.metadata || {};

  const donorName = meta.donor_name || null;
  const location = meta.location || null;
  const phone = meta.phone || null;
  const donorEmail = (txn.customer?.email || "").toLowerCase() || null;

  // Convert at a live rate rather than trusting the browser's usd_equivalent,
  // which was computed from a possibly stale hardcoded rate. Same treatment as
  // verify-paystack-transaction, so a synced row is indistinguishable from one
  // recorded at payment time.
  const { rates, source: fxSource, live: fxLive } = await getRates();
  const usdAmount = round2(toUSD(amountKES, chargedCurrency, rates));
  const fxRate = round6(rateFor(rates, chargedCurrency));
  const fxRateSource = fxLive ? fxSource : "static-fallback";

  // Conflict-safe insert: relies on the UNIQUE constraint on
  // donations.payment_reference so re-running a sync never duplicates rows.
  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .insert({
      donor_name: donorName,
      donor_email: donorEmail,
      donor_id: meta.donor_id || null,
      amount: usdAmount,
      usd_amount: usdAmount,
      currency: "USD",
      amount_original: amountKES,
      charged_currency: chargedCurrency,
      converted_amount: amountKES,
      fx_rate: fxRate,
      fx_rate_source: fxRateSource,
      frequency: meta.frequency || "one-time",
      status: "completed",
      // Not taken from metadata: the database derives this from the
      // sponsorship_payments links written below (migration 005), so a
      // backfilled payment is classified by the sponsorship it actually
      // created rather than by what the original browser claimed.
      is_sponsorship: false,
      payment_reference: txn.reference,
      // Preserve Paystack's original charge time — during a backfill sync
      // "now" would wrongly reflect when the sync ran, not when the donor
      // actually paid.
      created_at: txn.created_at || undefined,
      location,
      phone,
    })
    .select()
    .single();

  // 23505 = unique_violation — already recorded; patch in any missing
  // display fields / account link instead of failing.
  const alreadyRecorded = donationError?.code === "23505";
  if (donationError && !alreadyRecorded) throw donationError;

  if (alreadyRecorded) {
    const patch: Record<string, string> = {};
    if (donorName) patch.donor_name = donorName;
    if (location) patch.location = location;
    if (phone) patch.phone = phone;
    if (meta.donor_id) patch.donor_id = meta.donor_id;
    if (donorEmail) patch.donor_email = donorEmail;
    // is_sponsorship is deliberately absent from this patch: it is derived
    // from the links, and only a link can legitimately turn it true. Patching
    // it from metadata here is what let an unbacked claim stick.

    if (Object.keys(patch).length > 0) {
      const { error: patchError } = await supabase
        .from("donations")
        .update(patch)
        .eq("payment_reference", txn.reference)
        .or("donor_name.is.null,donor_id.is.null,donor_email.is.null,location.is.null,phone.is.null");
      if (patchError) console.error("Backfill of donor details failed:", patchError);
    }
  }

  // Sponsorship intent comes from Paystack's own metadata — same as the
  // verify function, so a backfill sync also records the sponsorship and the
  // amount the donor sponsored the child with. A single payment may sponsor
  // several children (cart checkout): each child in `metadata.children` gets
  // its own sponsorship row linked to the same payment.
  const sponsorshipChildren: {
    child_id: string;
    amount: number | null;
    monthly_amount: number | null;
  }[] = Array.isArray(meta.children) && meta.children.length > 0
    ? meta.children
    : meta.is_sponsorship && meta.child_id && meta.donor_id
      ? [{
          child_id: meta.child_id,
          amount: usdAmount,
          monthly_amount: meta.monthly_amount ?? null,
        }]
      : [];

  // A payment carrying renew_sponsorship_id is a monthly renewal. Advance the
  // period so the sponsorship stops reading as overdue. The RPC requires the
  // service role and re-checks that this completed payment belongs to the
  // sponsorship's donor, and is a no-op when the period is already current —
  // so re-running a sync is safe.
  if (meta.renew_sponsorship_id) {
    const { data: advanced, error: advanceError } = await supabase.rpc(
      "advance_monthly_period",
      {
        p_sponsorship_id: meta.renew_sponsorship_id,
        p_payment_reference: txn.reference,
      }
    );
    if (advanceError) {
      console.error("Failed to advance monthly period during sync:", advanceError);
    } else if (advanced?.child_id) {
      await supabase
        .from("children")
        .update({ sponsorship_status: "sponsored" })
        .eq("id", advanced.child_id);
    }

    // Link the payment to the sponsorship it renewed, so every renewal keeps
    // its own audit row instead of overwriting the previous one. The sync may
    // run when the donation was already recorded by the webhook, so resolve
    // the id either way.
    if (advanced?.id) {
      let renewalDonationId = donation?.id ?? null;
      if (!renewalDonationId) {
        const { data: existingDonation } = await supabase
          .from("donations")
          .select("id")
          .eq("payment_reference", txn.reference)
          .maybeSingle();
        renewalDonationId = existingDonation?.id ?? null;
      }
      if (renewalDonationId) {
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
          console.error("Failed to link renewal payment during sync:", linkError);
        }
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
        // A new monthly sponsorship is paid for the month starting today, so
        // the next payment falls due one calendar month from now.
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

        // The link is the source of truth for "this payment was a child
        // sponsorship"; the donations trigger derives the flag from it.
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
        // Already sponsors this child: no new sponsorship row, but the payment
        // still funded one, so link it or it would be filed as a general
        // donation.
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

// Confirms the caller's Supabase session is genuine and belongs to an
// allowlisted admin. The token is verified against the auth server (not just
// decoded), so a forged JWT can't pass — the gateway does not verify user
// JWTs for functions deployed with verify_jwt disabled.
async function isAdminCaller(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || !anonKey) return false;

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!res.ok) return false;
    const user = await res.json();
    const email = (user?.email || "").toLowerCase();
    return email && ADMIN_EMAILS.includes(email);
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

    if (!(await isAdminCaller(req, supabaseUrl, anonKey))) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Pull recent successful transactions straight from Paystack. Up to 5
    // pages of 100 covers ~500 of the most recent charges; per-page failures
    // abort with a clear error rather than silently importing a partial set.
    let scanned = 0;
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `https://api.paystack.co/transaction?status=success&perPage=100&page=${page}`,
        { headers: { Authorization: `Bearer ${paystackSecret}` } }
      );
      const json = await res.json();
      if (!res.ok || !json.status) {
        throw new Error(`Paystack list failed: ${JSON.stringify(json?.message || json)}`);
      }

      const txns = json.data || [];
      scanned += txns.length;

      for (const txn of txns) {
        try {
          const { alreadyRecorded } = await recordVerifiedTransaction(txn, supabase);
          if (alreadyRecorded) skipped++;
          else imported++;
        } catch (err) {
          console.error(`Failed to record ${txn.reference}:`, err);
          errors++;
        }
      }

      // Paystack returns fewer rows than requested on the last page.
      if (txns.length < 100) break;
    }

    return new Response(
      JSON.stringify({ success: true, scanned, imported, skipped, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-paystack-transactions error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
