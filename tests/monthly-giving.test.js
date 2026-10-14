import test from "node:test";
import assert from "node:assert/strict";
import { monthlyGiftStatus } from "../src/lib/monthlyGiving.js";

const gift = (created_at, extra = {}) => ({
  frequency: "monthly",
  is_sponsorship: false,
  status: "completed",
  amount: 25,
  created_at,
  ...extra,
});

test("no reminder without a monthly donation", () => {
  assert.equal(monthlyGiftStatus([]), null);
  assert.equal(
    monthlyGiftStatus([gift("2026-09-03T10:00:00Z", { frequency: "one-time" })]),
    null,
  );
  assert.equal(
    monthlyGiftStatus([gift("2026-09-03T10:00:00Z", { is_sponsorship: true })]),
    null,
  );
});

test("gift made this month is not due; next due on the 1st", () => {
  const status = monthlyGiftStatus(
    [gift("2026-10-02T09:00:00Z", { amount: 50 })],
    new Date("2026-10-20T00:00:00Z"),
  );
  assert.equal(status.due, false);
  assert.equal(status.lastAmount, 50);
  assert.equal(status.nextDue.toISOString(), "2026-11-01T00:00:00.000Z");
});

test("gift from an earlier month is due, using the latest gift", () => {
  const status = monthlyGiftStatus(
    [
      gift("2026-08-15T09:00:00Z", { amount: 100 }),
      gift("2026-09-28T09:00:00Z", { amount: 25 }),
      gift("2026-09-29T09:00:00Z", { status: "pending", amount: 300 }),
    ],
    new Date("2026-10-01T08:00:00Z"),
  );
  assert.equal(status.due, true);
  assert.equal(status.lastAmount, 25);
});

import {
  monthlySponsorshipStatus,
  sponsorshipPaymentState,
} from "../src/lib/monthlyGiving.js";

const sponsorship = (extra = {}) => ({
  id: "s1",
  status: "active",
  funding_model: "annual_v1",
  monthly_amount: 25,
  amount: 25,
  start_date: "2026-09-10T10:00:00Z",
  children: { id: "c1", first_name: "Esther" },
  ...extra,
});

test("no sponsorship reminder without an active monthly sponsorship", () => {
  assert.equal(monthlySponsorshipStatus([]), null);
  assert.equal(
    monthlySponsorshipStatus([sponsorship({ monthly_amount: null })]),
    null,
  );
  assert.equal(
    monthlySponsorshipStatus([sponsorship({ status: "cancelled" })]),
    null,
  );
  // Older-style sponsorships are not part of monthly reminders.
  assert.equal(
    monthlySponsorshipStatus([sponsorship({ funding_model: null })]),
    null,
  );
});

test("first month paid is not due; the next month is", () => {
  const sep = monthlySponsorshipStatus(
    [sponsorship()],
    new Date("2026-09-25T00:00:00Z"),
  );
  assert.equal(sep.due, false);
  assert.equal(sep.nextDue.toISOString(), "2026-10-01T00:00:00.000Z");

  const oct = monthlySponsorshipStatus(
    [sponsorship()],
    new Date("2026-10-02T00:00:00Z"),
  );
  assert.equal(oct.due, true);
  assert.equal(oct.dueTotal, 25);
});

test("paying the second month clears the reminder", () => {
  const status = monthlySponsorshipStatus(
    [sponsorship({ amount: 50 })],
    new Date("2026-10-20T00:00:00Z"),
  );
  assert.equal(status.due, false);
});

test("only children that are behind are due, with their own amounts", () => {
  const status = monthlySponsorshipStatus(
    [
      sponsorship(),
      sponsorship({
        id: "s2",
        monthly_amount: 50,
        amount: 100,
        children: { id: "c2", first_name: "Joram" },
      }),
      sponsorship({
        id: "s3",
        monthly_amount: 50,
        amount: 50,
        children: { id: "c3", first_name: "Ruth" },
      }),
    ],
    new Date("2026-10-05T00:00:00Z"),
  );
  assert.deepEqual(
    status.dueChildren.map((c) => c.child.first_name),
    ["Esther", "Ruth"],
  );
  assert.equal(status.dueTotal, 75);
});

test("one missed month is due; two or more missed months is overdue", () => {
  const s = sponsorship(); // started Sep, $25 paid
  const oct = sponsorshipPaymentState(s, new Date("2026-10-15T00:00:00Z"));
  assert.equal(oct.monthsBehind, 1);
  assert.equal(oct.due, true);
  assert.equal(oct.overdue, false);

  const nov = sponsorshipPaymentState(s, new Date("2026-11-15T00:00:00Z"));
  assert.equal(nov.monthsBehind, 2);
  assert.equal(nov.overdue, true);

  // Paying one month brings it back to "due", not overdue.
  const caughtUp = sponsorshipPaymentState(
    sponsorship({ amount: 50 }),
    new Date("2026-11-15T00:00:00Z"),
  );
  assert.equal(caughtUp.monthsBehind, 1);
  assert.equal(caughtUp.overdue, false);

  const status = monthlySponsorshipStatus([s], new Date("2026-11-15T00:00:00Z"));
  assert.equal(status.overdue, true);
});

test("non-monthly or inactive sponsorships have no payment state", () => {
  assert.equal(sponsorshipPaymentState(sponsorship({ monthly_amount: null })), null);
  assert.equal(sponsorshipPaymentState(sponsorship({ status: "paused" })), null);
});
