import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Same allowlist as the is_admin() SQL helper in migrations.sql.
const ADMIN_EMAILS = ["masooshem@gmail.com", "kadeshhope.africa@gmail.com"];

import { recordVerifiedTransaction } from "../_shared/record-verified-transaction.js";

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
