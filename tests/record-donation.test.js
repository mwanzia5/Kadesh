import test from "node:test";
import assert from "node:assert/strict";
import { recordVerifiedTransaction } from "../supabase/functions/_shared/record-verified-transaction.js";

function fakeSupabase() {
  const inserted = [];
  return {
    inserted,
    from() {
      return {
        insert(row) {
          inserted.push(row);
          return {
            select: () => ({ single: async () => ({ data: { id: 1, ...row }, error: null }) }),
          };
        },
      };
    },
  };
}

const txn = (usd, extra = {}, metaExtra = {}) => ({
  reference: "KHM-1",
  currency: "KES",
  amount: Math.round(usd * 129 * 100),
  paid_at: "2026-10-07T10:00:00Z",
  customer: { email: "Guest@Example.com" },
  metadata: {
    giving_model: "donation_v1",
    donation_amount_type: "custom",
    usd_equivalent: usd,
    frequency: "one-time",
    donor_id: null,
    ...metaExtra,
  },
  ...extra,
});

test("guest $75 one-time donation is recorded with lowercased email", async () => {
  const db = fakeSupabase();
  await recordVerifiedTransaction(txn(75), db);
  assert.equal(db.inserted.length, 1);
  assert.equal(db.inserted[0].amount, 75);
  assert.equal(db.inserted[0].donor_id, null);
  assert.equal(db.inserted[0].donor_email, "guest@example.com");
  assert.equal(db.inserted[0].converted_amount, 9675);
});

test("$25 monthly donation is recorded", async () => {
  const db = fakeSupabase();
  await recordVerifiedTransaction(
    txn(25, {}, { frequency: "monthly", donation_amount_type: "preset" }),
    db,
  );
  assert.equal(db.inserted[0].frequency, "monthly");
});

test("charge that does not match the USD amount is rejected", async () => {
  const db = fakeSupabase();
  await assert.rejects(
    recordVerifiedTransaction(txn(500, { amount: 100 }), db),
    /does not match/,
  );
  assert.equal(db.inserted.length, 0);
});
