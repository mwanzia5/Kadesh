import { createClient } from "npm:@supabase/supabase-js@2";

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
  const amountKES = txn.amount / 100; // Paystack returns subunits
  const meta = txn.metadata || {};

  const donorName = meta.donor_name || null;
  const location = meta.location || null;
  const phone = meta.phone || null;
  const donorEmail = (txn.customer?.email || "").toLowerCase() || null;

  // Conflict-safe insert: relies on the UNIQUE constraint on
  // donations.payment_reference so re-running a sync never duplicates rows.
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
    if (meta.is_sponsorship) patch.is_sponsorship = "true";

    if (Object.keys(patch).length > 0) {
      const { error: patchError } = await supabase
        .from("donations")
        .update(patch)
        .eq("payment_reference", txn.reference)
        .or(
          "donor_name.is.null,donor_id.is.null,donor_email.is.null,location.is.null,phone.is.null,is_sponsorship.is.false"
        );
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
          amount: meta.usd_equivalent ?? amountKES,
          monthly_amount: meta.monthly_amount ?? null,
        }]
      : [];

  if (!alreadyRecorded && meta.donor_id && sponsorshipChildren.length > 0) {
    for (const item of sponsorshipChildren) {
      const { data: existingSponsorship } = await supabase
        .from("sponsorships")
        .select("id")
        .eq("donor_id", meta.donor_id)
        .eq("child_id", item.child_id)
        .eq("status", "active")
        .maybeSingle();

      if (!existingSponsorship) {
        const { error: sponsorshipError } = await supabase.from("sponsorships").insert({
          donor_id: meta.donor_id,
          child_id: item.child_id,
          status: "active",
          monthly_amount: Number(item.monthly_amount) || null,
          amount: Number(item.amount) || null,
          donation_id: donation?.id ?? null,
        });
        if (sponsorshipError) throw sponsorshipError;

        const { error: childError } = await supabase
          .from("children")
          .update({ sponsorship_status: "sponsored" })
          .eq("id", item.child_id);
        if (childError) throw childError;
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
