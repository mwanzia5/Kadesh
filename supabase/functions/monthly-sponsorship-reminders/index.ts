// supabase/functions/monthly-sponsorship-reminders/index.ts
//
// Emails donors whose monthly child sponsorship payment is due or overdue.
// Monthly sponsorships are paid by hand each month (no automatic charge), so
// this is how donors who don't sign in hear that a payment is due.
//
// Runs once a day from pg_cron (see supabase/monthly-sponsorship-reminders.sql).
// Each donor gets at most one "due" and one "overdue" email per month; every
// send is recorded in public.sponsorship_reminder_log so nothing repeats.
//
// Protected by a shared secret: requests must send the header
//   x-cron-secret: <CRON_SECRET>
// POST body (optional): { "dry_run": true } lists who WOULD be emailed
// without sending anything.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildReminders,
  renderReminderEmail,
} from "../_shared/sponsorship-reminders.js";

// Must be an address on the domain verified in Resend (same as notify-contact).
const FROM_ADDRESS = "Kadesh Hope Mission <noreply@contact.kadeshhopemission.org>";
const REPLY_TO = "kadeshhope.africa@gmail.com";
// Resend's free plan allows 100 emails a day; stay safely under it. Anyone
// not reached today is picked up by tomorrow's run.
const MAX_EMAILS_PER_RUN = 80;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("RESEND");
  let dryRun = false;
  try {
    dryRun = Boolean((await req.json())?.dry_run);
  } catch {
    // No body: a normal scheduled run.
  }
  if (!dryRun && !resendKey) {
    return json({ error: "RESEND_API_KEY is not set" }, 500);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const now = new Date();

    const { data: sponsorships, error: sError } = await supabase
      .from("sponsorships")
      .select(
        "id, donor_id, status, funding_model, monthly_amount, amount, start_date, created_at, children(first_name)",
      )
      .eq("status", "active")
      .eq("funding_model", "annual_v1")
      .not("monthly_amount", "is", null);
    if (sError) throw sError;

    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const { data: log, error: logError } = await supabase
      .from("sponsorship_reminder_log")
      .select("donor_id, month, kind")
      .eq("month", month);
    if (logError) throw logError;
    const alreadySent = new Set(
      (log || []).map((r) => `${r.donor_id}|${r.month}|${r.kind}`),
    );

    const reminders = buildReminders(sponsorships || [], alreadySent, now);
    const batch = reminders.slice(0, MAX_EMAILS_PER_RUN);

    // Donor names/emails from their profiles, falling back to their login.
    const donorIds = batch.map((r) => r.donorId);
    const { data: profiles } = donorIds.length
      ? await supabase
          .from("donor_profiles")
          .select("id, first_name, email")
          .in("id", donorIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const results: Array<Record<string, unknown>> = [];
    for (const reminder of batch) {
      const profile = profileMap.get(reminder.donorId);
      let email = profile?.email || null;
      if (!email) {
        const { data } = await supabase.auth.admin.getUserById(reminder.donorId);
        email = data?.user?.email || null;
      }
      if (!email) {
        results.push({ donor_id: reminder.donorId, skipped: "no email address" });
        continue;
      }

      const message = renderReminderEmail(reminder, profile?.first_name || "");
      if (dryRun) {
        results.push({
          donor_id: reminder.donorId,
          email,
          kind: reminder.kind,
          subject: message.subject,
          total: reminder.total,
        });
        continue;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [email],
          reply_to: REPLY_TO,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("Resend error", res.status, detail);
        results.push({ donor_id: reminder.donorId, error: `Resend ${res.status}` });
        // Daily limit reached: stop now, tomorrow's run continues.
        if (res.status === 429) break;
        continue;
      }

      const { error: insertError } = await supabase
        .from("sponsorship_reminder_log")
        .insert({ donor_id: reminder.donorId, month: reminder.month, kind: reminder.kind });
      if (insertError) console.error("Could not log reminder", insertError);
      results.push({ donor_id: reminder.donorId, kind: reminder.kind, sent: true });
    }

    return json({
      dry_run: dryRun,
      month,
      due_donors: reminders.length,
      processed: batch.length,
      left_for_tomorrow: Math.max(0, reminders.length - batch.length),
      results,
    });
  } catch (err) {
    console.error("monthly-sponsorship-reminders error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
