// Decides which donors get a monthly-sponsorship reminder email and builds
// the email. Kept free of network/database code so it can be unit-tested.
import { sponsorshipPaymentState } from "./monthly-sponsorship.js";

export const SITE_URL = "https://kadeshhopemission.org";
export const ACCOUNT_URL = `${SITE_URL}/donor-auth?mode=login&redirect=%2Faccount`;
export const CONTACT_EMAIL = "kadeshhope.africa@gmail.com";

// "2026-10" — reminders are sent at most once per donor per month per kind.
export function reminderMonth(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

// sponsorships: active rows with { donor_id, children: { first_name }, ... }
// alreadySent: Set of `${donor_id}|${month}|${kind}` keys from the log.
// Returns one reminder per donor: kind "overdue" when any child is 2+
// payments behind (sent even if a "due" email already went out this month),
// otherwise "due".
export function buildReminders(sponsorships, alreadySent = new Set(), now = new Date()) {
  const month = reminderMonth(now);
  const byDonor = new Map();
  for (const s of Array.isArray(sponsorships) ? sponsorships : []) {
    const state = sponsorshipPaymentState(s, now);
    if (!state?.due || !s.donor_id) continue;
    const list = byDonor.get(s.donor_id) || [];
    list.push({
      sponsorshipId: s.id,
      childName: s.children?.first_name || "your sponsored child",
      ...state,
    });
    byDonor.set(s.donor_id, list);
  }

  const reminders = [];
  for (const [donorId, children] of byDonor) {
    const kind = children.some((c) => c.overdue) ? "overdue" : "due";
    const key = `${donorId}|${month}|${kind}`;
    // Once overdue was sent this month, never follow it with a "due" email.
    if (alreadySent.has(key) || alreadySent.has(`${donorId}|${month}|overdue`))
      continue;
    reminders.push({
      donorId,
      month,
      kind,
      children,
      total: children.reduce((sum, c) => sum + c.monthlyAmount, 0),
    });
  }
  return reminders;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function listNames(names) {
  if (names.length <= 1) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function renderReminderEmail(reminder, donorFirstName) {
  const overdue = reminder.kind === "overdue";
  const names = reminder.children.map((c) => c.childName);
  const subject = overdue
    ? `Your sponsorship payment for ${listNames(names)} is overdue`
    : `Your monthly sponsorship for ${listNames(names)} is due`;
  const greeting = donorFirstName ? `Hi ${escapeHtml(donorFirstName)},` : "Hello,";

  const rows = reminder.children
    .map(
      (c) => `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #e8edf3;font-size:15px;color:#0f2652;">${escapeHtml(c.childName)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e8edf3;font-size:15px;color:#0f2652;text-align:right;">$${c.monthlyAmount}/month${
            c.monthsBehind > 1
              ? `<br><span style="font-size:13px;color:#b42318;">${c.monthsBehind} months unpaid</span>`
              : ""
          }</td>
        </tr>`,
    )
    .join("");

  const intro = overdue
    ? `We haven't received your monthly sponsorship payments for the last couple of months. Your support makes a real difference, and we'd love to keep it going.`
    : `This is a friendly reminder that this month's sponsorship payment is due. Monthly sponsorships aren't charged automatically, so each month's support is paid from your account.`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#12366d;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;">Kadesh Hope Mission</td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 14px;font-size:16px;color:#0f2652;">${greeting}</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#3d4b5c;">${intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">${rows}</table>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:${overdue ? "#b42318" : "#1e5bab"};">
            <a href="${ACCOUNT_URL}" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Pay $${reminder.total} for this month</a>
          </td></tr></table>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#6b7785;">Sign in to your account and choose “Pay” on the reminder at the top. If you've already paid, thank you, and please ignore this email. To stop sponsoring, you can cancel from your account at any time, or reply to <a href="mailto:${CONTACT_EMAIL}" style="color:#1e5bab;">${CONTACT_EMAIL}</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    donorFirstName ? `Hi ${donorFirstName},` : "Hello,",
    "",
    overdue
      ? "We haven't received your monthly sponsorship payments for the last couple of months."
      : "This month's sponsorship payment is due. Monthly sponsorships aren't charged automatically.",
    "",
    ...reminder.children.map(
      (c) =>
        `- ${c.childName}: $${c.monthlyAmount}/month${c.monthsBehind > 1 ? ` (${c.monthsBehind} months unpaid)` : ""}`,
    ),
    "",
    `Pay $${reminder.total} for this month: ${ACCOUNT_URL}`,
    "",
    `Already paid? Thank you, and please ignore this email. Questions: ${CONTACT_EMAIL}`,
  ].join("\n");

  return { subject, html, text };
}
