import test from "node:test";
import assert from "node:assert/strict";
import {
  DONATION_AMOUNTS,
  KES_PER_USD,
  donationAmountsFor,
  isRecordableDonationAmount,
  isValidDonationAmount,
  MIN_CUSTOM_DONATION,
  usdToKesSubunits,
  sponsorshipSelectionError,
  validateSponsorshipAllocation,
  annualChildStatus,
  isValidSponsorshipAmount,
  hasAnnualFundingAmount,
} from "../supabase/functions/_shared/sponsorship-rules.js";
import { normalizeSponsorshipItem } from "../src/lib/sponsorship.js";

const item = (type, amount, id = "child-a") => ({
  child_id: id,
  support_type: type,
  amount,
});
const funding = (amount, other = {}) => ({
  funded_amount: amount,
  legacy_reserved: false,
  pending: false,
  ...other,
});

test("donation presets are $25, $50, $100, $300 and $500", () => {
  for (const frequency of ["one-time", "monthly"]) {
    assert.deepEqual(donationAmountsFor(frequency), [25, 50, 100, 300, 500]);
    for (const amount of donationAmountsFor(frequency))
      assert.ok(isValidDonationAmount(amount, false, frequency));
    for (const amount of [0, 10, 24, 75, 150, 600])
      assert.equal(isValidDonationAmount(amount, false, frequency), false);
  }
  assert.deepEqual(DONATION_AMOUNTS, [25, 50, 100, 300, 500]);
});
test("custom amounts must be at least $25", () => {
  assert.equal(MIN_CUSTOM_DONATION, 25);
  for (const frequency of ["one-time", "monthly"]) {
    for (const amount of ["", -25, 0, 10, 24.99, NaN, "invalid", 25.001])
      assert.equal(
        isValidDonationAmount(amount, true, frequency),
        false,
        `${frequency} ${amount}`,
      );
    for (const amount of [25, "25", 25.01, 40, 850.25])
      assert.ok(isValidDonationAmount(amount, true, frequency), `${frequency} ${amount}`);
  }
});
test("verified payments are recordable from $25 so no real gift is lost", () => {
  assert.ok(isRecordableDonationAmount(25));
  assert.ok(isRecordableDonationAmount(500));
  assert.equal(isRecordableDonationAmount(24.99), false);
  assert.equal(isRecordableDonationAmount(""), false);
});
test("KES charge uses the single shared rate", () => {
  assert.equal(KES_PER_USD, 129);
  assert.equal(usdToKesSubunits(50), 645000);
  assert.equal(usdToKesSubunits(25.5), 328950);
});
test("one-time child sponsorship minimum is $25", () => {
  assert.ok(isValidSponsorshipAmount(25));
  assert.equal(isValidSponsorshipAmount(24.99), false);
});
test("partial and full annual allocations can cover multiple children", () => {
  const items = [
    item("education", 100, "a"),
    item("supplies", 100, "b"),
    item("meals", 100, "c"),
    item("full", 300, "d"),
    item("one-time", 50, "e"),
  ];
  assert.deepEqual(
    validateSponsorshipAllocation(items, 650, "one-time"),
    items,
  );
  assert.equal(
    validateSponsorshipAllocation(
      [item("monthly", 25, "a"), item("monthly", 25, "b")],
      50,
      "monthly",
    ).length,
    2,
  );
});
test("empty, duplicated, underpaid, mismatched and mixed-frequency carts are rejected", () => {
  assert.throws(() => validateSponsorshipAllocation([], 0, "one-time"));
  assert.throws(() =>
    validateSponsorshipAllocation(
      [item("full", 300), item("full", 300)],
      600,
      "one-time",
    ),
  );
  assert.throws(() =>
    validateSponsorshipAllocation([item("full", 50)], 50, "one-time"),
  );
  assert.throws(() =>
    validateSponsorshipAllocation([item("full", 300)], 100, "one-time"),
  );
  assert.throws(() =>
    validateSponsorshipAllocation([item("monthly", 25)], 25, "one-time"),
  );
  assert.throws(() =>
    validateSponsorshipAllocation([item("one-time", 50)], 50, "monthly"),
  );
  assert.throws(() =>
    validateSponsorshipAllocation([item("other", 25)], 25, "monthly"),
  );
});
test("the twelfth $25 payment fits; funded children request a new selection", () => {
  assert.equal(
    sponsorshipSelectionError(item("monthly", 25), funding(275)),
    null,
  );
  assert.match(
    sponsorshipSelectionError(item("monthly", 25), funding(300)),
    /choose another child/i,
  );
  assert.match(
    sponsorshipSelectionError(item("monthly", 25), funding(325)),
    /choose another child/i,
  );
  assert.match(
    sponsorshipSelectionError(item("full", 300), funding(50)),
    /Choose a \$100 option or sponsor another child/i,
  );
  assert.equal(
    sponsorshipSelectionError(item("monthly", 50), funding(250)),
    null,
  );
  assert.match(
    sponsorshipSelectionError(item("monthly", 50), funding(275)),
    /Choose \$25 per month or sponsor another child/i,
  );
  assert.match(
    sponsorshipSelectionError(item("education", 100), funding(250)),
    /Please choose another child/i,
  );
});
test("unknown availability and reserved children cannot proceed to payment", () => {
  assert.ok(sponsorshipSelectionError(item("monthly", 25), undefined));
  assert.ok(sponsorshipSelectionError(item("monthly", 25), funding("invalid")));
  assert.ok(
    sponsorshipSelectionError(
      item("monthly", 25),
      funding(0, { legacy_reserved: true }),
    ),
  );
  assert.ok(
    sponsorshipSelectionError(
      item("monthly", 25),
      funding(0, { pending: true }),
    ),
  );
});

test("legacy one-time payments from $25 stay recordable on the server", () => {
  for (const amount of [25, 25.01, 50, 75.55, "299.99", 500]) {
    assert.equal(isValidSponsorshipAmount(amount), true, String(amount));
    assert.deepEqual(
      validateSponsorshipAllocation(
        [item("one-time", amount)],
        Number(amount),
        "one-time",
      ),
      [item("one-time", Number(amount))],
    );
  }
  for (const amount of [
    undefined,
    null,
    "",
    " ",
    false,
    true,
    [],
    {},
    0,
    -25,
    24.99,
    25.001,
    "invalid",
    NaN,
    Infinity,
  ]) {
    assert.equal(isValidSponsorshipAmount(amount), false, String(amount));
    assert.throws(() =>
      validateSponsorshipAllocation(
        [item("one-time", amount)],
        Number(amount),
        "one-time",
      ),
    );
  }
  assert.equal(isValidSponsorshipAmount(75, "monthly"), false);
  assert.equal(isValidSponsorshipAmount(25, "monthly"), true);
  assert.equal(isValidSponsorshipAmount(125, "education"), false);
  assert.equal(isValidSponsorshipAmount(100, "education"), true);
  // The custom one-time amount can no longer be chosen at checkout.
  assert.match(
    sponsorshipSelectionError(item("one-time", 75.55), funding(0)),
    /\$100 each/,
  );
  assert.equal(isValidSponsorshipAmount(50, "monthly"), true);
  assert.equal(isValidSponsorshipAmount(30, "monthly"), false);
  assert.match(
    sponsorshipSelectionError(item("monthly", 30), funding(0)),
    /\$25 or \$50 per month/,
  );
  assert.deepEqual(
    validateSponsorshipAllocation([item("monthly", 50)], 50, "monthly"),
    [item("monthly", 50)],
  );
  assert.throws(() =>
    validateSponsorshipAllocation([item("one-time", 25)], 25.001, "one-time"),
  );
});

test("missing annual metadata allows confirmed available children without fabricating totals", () => {
  const unavailable = {
    funded_amount: null,
    funding_available: false,
    child_status: "available",
  };
  assert.equal(hasAnnualFundingAmount(unavailable), false);
  assert.equal(hasAnnualFundingAmount(funding(0)), true);
  assert.equal(hasAnnualFundingAmount(funding("")), false);
  assert.equal(
    sponsorshipSelectionError(item("education", 100), unavailable),
    null,
  );
  assert.equal(sponsorshipSelectionError(item("full", 300), unavailable), null);
  for (const restrictions of [
    { pending: true },
    { legacy_reserved: true },
    { funded_amount: 300 },
    { child_status: "sponsored" },
    { child_status: undefined },
  ]) {
    assert.ok(
      sponsorshipSelectionError(item("meals", 100), {
        ...unavailable,
        ...restrictions,
      }),
    );
  }
  assert.match(
    sponsorshipSelectionError(item("supplies", 100), {
      ...unavailable,
      funded_amount: 275,
    }),
    /choose another child/i,
  );
  assert.equal(
    annualChildStatus(
      { sponsorship_status: "sponsored" },
      { ...unavailable, uses_annual_funding: true },
    ),
    "sponsored",
  );
});
test("new-year totals reopen annual-funded children while preserving legacy reservations", () => {
  const child = { sponsorship_status: "sponsored" };
  assert.equal(
    annualChildStatus(child, funding(300, { uses_annual_funding: true })),
    "sponsored",
  );
  assert.equal(
    annualChildStatus(child, funding(0, { uses_annual_funding: true })),
    "available",
  );
  assert.equal(
    annualChildStatus(
      child,
      funding(0, { uses_annual_funding: true, legacy_reserved: true }),
    ),
    "sponsored",
  );
  assert.equal(annualChildStatus(child, undefined), "sponsored");
});
test("persisted cart migration defaults to Education fees ($100) and derives prices from known plans", () => {
  assert.equal(
    normalizeSponsorshipItem({ child_id: "a", amount: 1 }).amount,
    100,
  );
  assert.equal(
    normalizeSponsorshipItem({ child_id: "a", support_type: "one-time", amount: 25 })
      .support_type,
    "education",
  );
  assert.equal(normalizeSponsorshipItem(item("full", 1)).amount, 300);
  const monthly = normalizeSponsorshipItem({
    ...item("monthly", 999),
    one_time_type: "education",
  });
  assert.equal(monthly.amount, 25);
  assert.equal(monthly.one_time_type, "education");
  assert.equal(normalizeSponsorshipItem(null), null);
  assert.equal(normalizeSponsorshipItem({ amount: 50 }), null);
});
