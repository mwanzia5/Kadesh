// Monthly child sponsorships: the rules live in one shared file so the
// account page, the admin page and the reminder emails always agree.
import {
  OVERDUE_AFTER_MONTHS,
  sponsorshipPaymentState,
} from "../../supabase/functions/_shared/monthly-sponsorship.js";

export { OVERDUE_AFTER_MONTHS, sponsorshipPaymentState };

// Monthly donations are paid by hand each month (no automatic card charge).
// This works out, from a donor's donation history, whether this calendar
// month's gift has been made yet so the account page can remind them.

function monthKey(date) {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

export function monthlyGiftStatus(donations, now = new Date()) {
  const monthly = (Array.isArray(donations) ? donations : [])
    .filter(
      (d) =>
        d &&
        d.frequency === "monthly" &&
        !d.is_sponsorship &&
        d.status === "completed" &&
        Number.isFinite(Date.parse(d.created_at)),
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  if (!monthly.length) return null;

  const last = monthly[0];
  const lastDate = new Date(last.created_at);
  const nextDue = new Date(
    Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth() + 1, 1),
  );
  return {
    lastAmount: Number(last.amount) || 0,
    lastDate,
    nextDue,
    due: monthKey(now) > monthKey(lastDate),
  };
}

export function monthlySponsorshipStatus(sponsorships, now = new Date()) {
  const children = (Array.isArray(sponsorships) ? sponsorships : [])
    .map((s) => {
      const state = sponsorshipPaymentState(s, now);
      return state
        ? {
            sponsorshipId: s.id,
            child: s.children || { id: s.child_id },
            ...state,
          }
        : null;
    })
    .filter(Boolean);
  if (!children.length) return null;

  const dueChildren = children.filter((c) => c.due);
  return {
    children,
    dueChildren,
    due: dueChildren.length > 0,
    overdue: dueChildren.some((c) => c.overdue),
    dueTotal: dueChildren.reduce((sum, c) => sum + c.monthlyAmount, 0),
    nextDue: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    ),
  };
}
