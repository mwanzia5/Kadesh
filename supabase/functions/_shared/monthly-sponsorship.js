// Monthly child sponsorship payment rules, shared by the website (account
// page reminders, admin "overdue" flag) and the reminder-email function.
// Monthly sponsorships are paid by hand each month (no automatic charge).
// Each active monthly sponsorship keeps a running total of what the donor has
// paid for that child (`amount`). One monthly amount is owed for every
// calendar month since the sponsorship started (the start month is month one).

export const MONTHLY_SPONSORSHIP_OPTIONS = Object.freeze([25, 50]);
// A monthly sponsorship this many (or more) payments behind is "overdue".
export const OVERDUE_AFTER_MONTHS = 2;

export function monthKey(date) {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

// Payment state of one sponsorship, or null when it is not an active
// monthly sponsorship. monthsBehind = unpaid months, including this one.
export function sponsorshipPaymentState(s, now = new Date()) {
  if (
    !s ||
    s.status !== "active" ||
    s.funding_model !== "annual_v1" ||
    !MONTHLY_SPONSORSHIP_OPTIONS.includes(Number(s.monthly_amount)) ||
    !Number.isFinite(Date.parse(s.start_date || s.created_at))
  )
    return null;
  const monthlyAmount = Number(s.monthly_amount);
  const start = new Date(s.start_date || s.created_at);
  const monthsSoFar = Math.max(1, monthKey(now) - monthKey(start) + 1);
  const paid = Number(s.amount) || 0;
  const monthsPaid = Math.floor(paid / monthlyAmount + 1e-9);
  const monthsBehind = Math.max(0, monthsSoFar - monthsPaid);
  return {
    monthlyAmount,
    paid,
    monthsBehind,
    due: monthsBehind > 0,
    overdue: monthsBehind >= OVERDUE_AFTER_MONTHS,
  };
}
