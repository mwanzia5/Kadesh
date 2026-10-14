// General donations. One-time gifts start at $100; monthly gifts start at $100.
// Monthly gifts are paid manually each month (no automatic card charge).
export const ONE_TIME_DONATION_AMOUNTS = Object.freeze([100, 150, 300, 500]);
export const MONTHLY_DONATION_AMOUNTS = Object.freeze([100, 150, 200, 300]);
export const DONATION_AMOUNTS = ONE_TIME_DONATION_AMOUNTS;
export const MIN_ONE_TIME_DONATION = 100;
export const MIN_MONTHLY_DONATION = 100;
// "Enter a different amount" (custom) gifts start at $500, monthly or one-time.
export const MIN_CUSTOM_DONATION = 500;
// Lowest gift the payment recorder accepts for any donation type. Kept at $25
// (the smallest monthly child sponsorship) so no verified payment is lost.
export const MIN_RECORDABLE_DONATION = 25;

// Paystack charges every gift in Kenyan shillings at this fixed rate.
// The checkout shows the donor this exact KSh amount before paying, and the
// payment recorder checks charges against it. Update it here only.
export const KES_PER_USD = 129;

export function usdToKesSubunits(usd) {
  return Math.round(Number(usd) * KES_PER_USD * 100);
}

export function donationFrequency(frequency) {
  return frequency === "monthly" ? "monthly" : "one-time";
}

export function donationAmountsFor(frequency) {
  return donationFrequency(frequency) === "monthly"
    ? MONTHLY_DONATION_AMOUNTS
    : ONE_TIME_DONATION_AMOUNTS;
}

export function minDonationFor(frequency) {
  return donationFrequency(frequency) === "monthly"
    ? MIN_MONTHLY_DONATION
    : MIN_ONE_TIME_DONATION;
}
// Child sponsorship (per child, per calendar year, $300 target):
// - one payment: $100 for Education fees, School supplies OR Meals,
//   or $300 for a full year; or
// - monthly: $25 or $50 per month until the $300 target is reached.
// "one-time" (a custom amount) is no longer offered. It stays recordable
// only so payments made under the old checkout are never lost.
export const MIN_ONE_TIME_SPONSORSHIP = 25;
export const DEFAULT_ONE_TIME_SPONSORSHIP = MIN_ONE_TIME_SPONSORSHIP;
export const ANNUAL_SPONSORSHIP_TARGET = 300;
export const MIN_SPONSORSHIP_PAYMENT = 100;
export const DEFAULT_SPONSORSHIP_PLAN = "education";
export const MONTHLY_SPONSORSHIP_AMOUNTS = Object.freeze([25, 50]);
export const DEFAULT_MONTHLY_SPONSORSHIP = 25;
export const ANNUAL_SPONSORSHIP_PLANS = Object.freeze([
  "education",
  "supplies",
  "meals",
  "full",
]);
export const SPONSORSHIP_OPTIONS = Object.freeze([
  {
    id: "education",
    amount: 100,
    label: "Education fees",
    description: "Education fees for one year",
    group: "Partial annual sponsorship",
  },
  {
    id: "supplies",
    amount: 100,
    label: "School supplies",
    description: "Uniforms, books, and school supplies for one year",
    group: "Partial annual sponsorship",
  },
  {
    id: "meals",
    amount: 100,
    label: "Meals",
    description: "Meals for one year",
    group: "Partial annual sponsorship",
  },
  {
    id: "full",
    amount: 300,
    label: "Full annual sponsorship",
    description: "Education fees, school supplies, and meals for one year",
    group: "Full annual sponsorship",
  },
  {
    id: "one-time",
    amount: DEFAULT_ONE_TIME_SPONSORSHIP,
    label: "One-time support",
    description: "A single contribution toward a child’s annual support",
    group: "Legacy",
    selectable: false,
  },
  {
    id: "monthly",
    amount: DEFAULT_MONTHLY_SPONSORSHIP,
    label: "Monthly support",
    description: "$25 or $50 per month toward the $300 annual target",
    group: "Monthly",
  },
]);

export function getSponsorshipOption(id) {
  return SPONSORSHIP_OPTIONS.find((option) => option.id === id);
}

function isMoneyAmount(value) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === ""
  )
    return false;
  const amount = Number(value);
  return (
    Number.isFinite(amount) &&
    Number.isSafeInteger(Math.round(amount * 100)) &&
    Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001
  );
}

export function isValidDonationAmount(
  value,
  custom = false,
  frequency = "one-time",
) {
  if (!isMoneyAmount(value)) return false;
  const amount = Number(value);
  return custom
    ? amount >= MIN_CUSTOM_DONATION
    : donationAmountsFor(frequency).includes(amount);
}

// Server-side check for a payment Paystack already verified. It only rejects
// tampered or nonsensical amounts; it must not reject a real gift made under
// older checkout rules, or the donor's money would go unrecorded.
export function isRecordableDonationAmount(value) {
  return isMoneyAmount(value) && Number(value) >= MIN_RECORDABLE_DONATION;
}

export function isValidSponsorshipAmount(value, supportType = "one-time") {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === ""
  )
    return false;
  const amount = Number(value);
  const option = getSponsorshipOption(supportType);
  return Boolean(
    option &&
    Number.isFinite(amount) &&
    Number.isSafeInteger(Math.round(amount * 100)) &&
    Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001 &&
    (supportType === "one-time"
      ? amount >= MIN_ONE_TIME_SPONSORSHIP
      : supportType === "monthly"
        ? MONTHLY_SPONSORSHIP_AMOUNTS.includes(amount)
        : amount === option.amount),
  );
}

// Options a donor can choose today (excludes the retired custom amount).
export function isSelectableSponsorshipOption(id) {
  const option = getSponsorshipOption(id);
  return Boolean(option && option.selectable !== false);
}

// Unknown totals must remain unknown; Number(null) would incorrectly show $0.
export function hasAnnualFundingAmount(funding) {
  const value = funding?.funded_amount;
  return (
    (typeof value === "number" || typeof value === "string") &&
    String(value).trim() !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0
  );
}

export function sponsorshipRemaining(funded = 0) {
  const amount = Number(funded);
  return Math.max(
    0,
    Math.round(
      (ANNUAL_SPONSORSHIP_TARGET - (Number.isFinite(amount) ? amount : 0)) *
        100,
    ) / 100,
  );
}

export function sponsorshipSelectionError(item, funding) {
  const option = getSponsorshipOption(item.support_type);
  if (!option || !isSelectableSponsorshipOption(option.id))
    return "Choose Education fees, School supplies or Meals ($100 each), a full year ($300), or monthly support.";
  if (!isValidSponsorshipAmount(item.amount, option.id))
    return option.id === "monthly"
      ? "Choose $25 or $50 per month."
      : "Please choose a sponsorship option again.";
  if (!funding)
    return "We could not confirm this child’s availability. Please try again.";
  if (funding.legacy_reserved || funding.pending)
    return "This child is not currently available. Please choose another child.";
  // The aggregate RPC is optional to checkout. A fresh public child lookup
  // still establishes availability when totals cannot be fetched. Preserve
  // any known balance, and never turn a missing balance into zero.
  if (
    funding.funding_available === false &&
    funding.child_status !== "available"
  )
    return "This child is not currently available. Please choose another child.";
  if (!hasAnnualFundingAmount(funding))
    return funding.funding_available === false
      ? null
      : "We could not confirm this child’s availability. Please try again.";
  const remaining = sponsorshipRemaining(funding.funded_amount);
  if (remaining === 0)
    return "This child's $300 support for this year is complete. Please choose another child.";
  if (Number(item.amount) > remaining)
    return remaining >= 25 && option.id === "monthly"
      ? `Only $${remaining} remains for this child this year. Choose $25 per month or sponsor another child.`
      : remaining >= MIN_SPONSORSHIP_PAYMENT
        ? `Only $${remaining} remains for this child this year. Choose a $100 option or sponsor another child.`
        : `Only $${remaining} remains for this child this year. Please choose another child.`;
  return null;
}

export function annualChildStatus(child, funding) {
  if (!funding) return child.sponsorship_status;
  if (funding.pending) return "pending";
  if (
    funding.legacy_reserved ||
    Number(funding.funded_amount) >= ANNUAL_SPONSORSHIP_TARGET
  )
    return "sponsored";
  return funding.funding_available === false
    ? child.sponsorship_status
    : funding.uses_annual_funding
      ? "available"
      : child.sponsorship_status;
}

// Used by the verified-payment recorder as well as local unit tests.
export function validateSponsorshipAllocation(items, total, frequency) {
  if (!Array.isArray(items) || items.length === 0)
    throw new Error("Choose at least one child.");
  if (!["monthly", "one-time"].includes(frequency))
    throw new Error("Invalid sponsorship frequency.");
  const ids = new Set();
  let cents = 0;
  const normalized = items.map((item) => {
    const option = getSponsorshipOption(item.support_type);
    if (!item.child_id || ids.has(item.child_id))
      throw new Error("Each child must appear only once per payment.");
    if (!option || !isValidSponsorshipAmount(item.amount, option.id))
      throw new Error("Invalid sponsorship amount.");
    if ((option.id === "monthly") !== (frequency === "monthly"))
      throw new Error(
        "Sponsorship frequency does not match the selected option.",
      );
    ids.add(item.child_id);
    const amount = Number(item.amount);
    cents += Math.round(amount * 100);
    return {
      child_id: item.child_id,
      amount,
      support_type: option.id,
    };
  });
  if (
    !Number.isFinite(Number(total)) ||
    !Number.isSafeInteger(Math.round(Number(total) * 100)) ||
    Math.abs(Number(total) * 100 - Math.round(Number(total) * 100)) >=
      0.000001 ||
    cents !== Math.round(Number(total) * 100)
  )
    throw new Error("The child allocations must equal the payment total.");
  return normalized;
}
