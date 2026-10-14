export * from "../../supabase/functions/_shared/sponsorship-rules.js";

import {
  ANNUAL_SPONSORSHIP_PLANS,
  DEFAULT_MONTHLY_SPONSORSHIP,
  DEFAULT_SPONSORSHIP_PLAN,
  MONTHLY_SPONSORSHIP_AMOUNTS,
  getSponsorshipOption,
  isValidSponsorshipAmount,
} from "../../supabase/functions/_shared/sponsorship-rules.js";

export const SPONSORSHIP_CHECKOUT = "/sponsor-a-child/checkout";
export const currentFundingYear = () => new Date().getUTCFullYear();

export function getSponsorshipSubtotal(items) {
  return (
    items.reduce(
      (cents, item) =>
        cents +
        (isValidSponsorshipAmount(item.amount, item.support_type)
          ? Math.round(Number(item.amount) * 100)
          : 0),
      0,
    ) / 100
  );
}

// A cart item remembers both an annual plan (Education fees, School supplies,
// Meals or Full year) and a monthly amount ($25/$50), so switching the cart
// between "one payment" and "monthly" never loses the donor's choices.
export function normalizeSponsorshipItem(item) {
  if (!item || typeof item.child_id !== "string" || !item.child_id) return null;
  const pickPlan = (id) =>
    ANNUAL_SPONSORSHIP_PLANS.includes(id) ? id : null;
  const annualPlan =
    pickPlan(item.one_time_type) ||
    pickPlan(item.support_type) ||
    DEFAULT_SPONSORSHIP_PLAN;
  const monthlyAmount = MONTHLY_SPONSORSHIP_AMOUNTS.includes(
    Number(item.monthly_amount),
  )
    ? Number(item.monthly_amount)
    : DEFAULT_MONTHLY_SPONSORSHIP;
  // The retired custom "one-time" amount becomes the default $100 plan.
  const supportType = item.support_type === "monthly" ? "monthly" : annualPlan;
  return {
    child_id: item.child_id,
    first_name: String(item.first_name || "Child"),
    photo_url: item.photo_url || null,
    location: item.location || null,
    support_type: supportType,
    one_time_type: annualPlan,
    monthly_amount: monthlyAmount,
    amount:
      supportType === "monthly"
        ? monthlyAmount
        : getSponsorshipOption(supportType).amount,
  };
}

export function changeSponsorshipFrequency(items, frequency) {
  return items.map((item) =>
    normalizeSponsorshipItem({
      ...item,
      support_type:
        frequency === "monthly"
          ? "monthly"
          : item.one_time_type || DEFAULT_SPONSORSHIP_PLAN,
    }),
  );
}

export function restoreSponsorshipCart(saved) {
  const entries = Array.isArray(saved) ? saved : saved?.items;
  const frequency = saved?.frequency === "monthly" ? "monthly" : "one-time";
  const seen = new Set();
  const items = (Array.isArray(entries) ? entries : [])
    .map(normalizeSponsorshipItem)
    .filter((item) => {
      if (!item || seen.has(item.child_id)) return false;
      seen.add(item.child_id);
      return true;
    });
  return { items: changeSponsorshipFrequency(items, frequency), frequency };
}

// supportType: an annual plan id or "monthly" (defaults to Education fees).
// monthlyAmount: 25 or 50 when supportType is "monthly".
export function addSponsorshipChild(cart, child, supportType, monthlyAmount) {
  const requested =
    supportType === "monthly" || ANNUAL_SPONSORSHIP_PLANS.includes(supportType)
      ? supportType
      : null;
  if (typeof child?.id !== "string" || !child.id) return cart;
  if (supportType && !requested) return cart;
  const exists = cart.items.some((item) => item.child_id === child.id);
  if (exists && !requested) return cart;

  // Checkout has one shared payment frequency for the whole cart.
  const frequency =
    requested === "monthly"
      ? "monthly"
      : requested
        ? "one-time"
        : cart.items.length
          ? cart.frequency
          : "one-time";
  const items = changeSponsorshipFrequency(cart.items, frequency);
  const chosen = (item) =>
    normalizeSponsorshipItem({
      ...item,
      support_type: frequency === "monthly" ? "monthly" : requested || item.one_time_type,
      one_time_type:
        requested && requested !== "monthly" ? requested : item.one_time_type,
      monthly_amount:
        requested === "monthly" && monthlyAmount
          ? monthlyAmount
          : item.monthly_amount,
    });
  return {
    frequency,
    items: exists
      ? items.map((item) => (item.child_id === child.id ? chosen(item) : item))
      : [
          ...items,
          chosen({
            child_id: child.id,
            first_name: child.first_name,
            photo_url: child.photo_url,
            location: child.location,
          }),
        ],
  };
}
