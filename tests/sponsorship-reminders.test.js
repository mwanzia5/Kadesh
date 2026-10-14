import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReminders,
  renderReminderEmail,
  reminderMonth,
} from "../supabase/functions/_shared/sponsorship-reminders.js";

const s = (extra = {}) => ({
  id: "s1",
  donor_id: "d1",
  status: "active",
  funding_model: "annual_v1",
  monthly_amount: 25,
  amount: 25,
  start_date: "2026-09-10T10:00:00Z",
  children: { first_name: "Esther" },
  ...extra,
});
const OCT = new Date("2026-10-01T06:00:00Z");
const NOV = new Date("2026-11-01T06:00:00Z");

test("paid-up donors get no reminder", () => {
  assert.deepEqual(buildReminders([s()], new Set(), new Date("2026-09-20T00:00:00Z")), []);
  assert.deepEqual(buildReminders([s({ amount: 50 })], new Set(), OCT), []);
});

test("one email per donor listing every child that is due", () => {
  const reminders = buildReminders(
    [s(), s({ id: "s2", monthly_amount: 50, amount: 50, children: { first_name: "Joram" } }), s({ id: "s3", donor_id: "d2" })],
    new Set(),
    OCT,
  );
  assert.equal(reminders.length, 2);
  const d1 = reminders.find((r) => r.donorId === "d1");
  assert.equal(d1.kind, "due");
  assert.equal(d1.total, 75);
  assert.equal(d1.month, "2026-10");
});

test("already-sent reminders are not repeated in the same month", () => {
  assert.deepEqual(buildReminders([s()], new Set(["d1|2026-10|due"]), OCT), []);
  // Next month it is sent again (and now overdue).
  const nov = buildReminders([s()], new Set(["d1|2026-10|due"]), NOV);
  assert.equal(nov.length, 1);
  assert.equal(nov[0].kind, "overdue");
});

test("overdue email still goes out after a due email this month, but never the reverse", () => {
  const overdue = buildReminders([s()], new Set(["d1|2026-11|due"]), NOV);
  assert.equal(overdue[0].kind, "overdue");
  assert.deepEqual(buildReminders([s()], new Set(["d1|2026-11|overdue"]), NOV), []);
});

test("inactive, cancelled and one-payment sponsorships are ignored", () => {
  assert.deepEqual(
    buildReminders(
      [s({ status: "cancelled" }), s({ status: "paused" }), s({ monthly_amount: null }), s({ funding_model: null })],
      new Set(),
      NOV,
    ),
    [],
  );
});

test("email names the children, amounts and a pay link, and escapes names", () => {
  const [reminder] = buildReminders(
    [s({ children: { first_name: "<b>Esther</b>" } })],
    new Set(),
    NOV,
  );
  const email = renderReminderEmail(reminder, "Shakeena");
  assert.match(email.subject, /overdue/);
  assert.match(email.html, /Hi Shakeena,/);
  assert.match(email.html, /&lt;b&gt;Esther&lt;\/b&gt;/);
  assert.doesNotMatch(email.html, /<b>Esther<\/b>/);
  assert.match(email.html, /2 months unpaid/);
  assert.match(email.html, /redirect=%2Faccount/);
  assert.match(email.text, /Pay \$25 for this month/);
  assert.equal(reminderMonth(new Date("2026-01-05T00:00:00Z")), "2026-01");
});
