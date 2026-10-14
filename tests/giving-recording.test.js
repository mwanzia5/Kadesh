import test from "node:test";
import assert from "node:assert/strict";
import { recordVerifiedTransaction } from "../supabase/functions/_shared/record-verified-transaction.js";

const transaction = (overrides = {}) => ({
  reference: "paid-001",
  status: "success",
  amount: 25 * 129 * 100,
  currency: "KES",
  paid_at: "2026-12-31T23:59:59Z",
  created_at: "2026-12-31T23:50:00Z",
  customer: { email: "DONOR@example.com" },
  metadata: {
    donor_id: "donor-a",
    is_sponsorship: true,
    sponsorship_model: "annual_v1",
    frequency: "monthly",
    usd_equivalent: 25,
    children: [{ child_id: "child-a", support_type: "monthly", amount: 25 }],
  },
  ...overrides,
});

function database({ failRpcOnce = false, rpcError = null } = {}) {
  const donations = new Map();
  const calls = [];
  let rpcFailed = false;
  return {
    donations,
    calls,
    from(table) {
      assert.equal(
        table,
        "donations",
        "annual allocations must use the atomic RPC",
      );
      return {
        insert(row) {
          return {
            select() {
              return {
                async single() {
                  if (donations.has(row.payment_reference))
                    return { data: null, error: { code: "23505" } };
                  const data = { ...row, id: "donation-" + donations.size };
                  donations.set(row.payment_reference, data);
                  return { data, error: null };
                },
              };
            },
          };
        },
        update() {
          return {
            eq() {
              return {
                async or() {
                  return { error: null };
                },
              };
            },
          };
        },
      };
    },
    async rpc(name, args) {
      calls.push({ name, args });
      if (rpcError) return { error: rpcError };
      if (failRpcOnce && !rpcFailed) {
        rpcFailed = true;
        return { error: new Error("temporary failure") };
      }
      return { error: null };
    },
  };
}

test("verified sponsorship records provider payment time and all child allocations", async () => {
  const db = database();
  await recordVerifiedTransaction(transaction(), db);
  const saved = db.donations.get("paid-001");
  assert.equal(saved.amount, 25);
  assert.equal(saved.converted_amount, 3225);
  assert.equal(saved.donor_email, "donor@example.com");
  assert.equal(saved.created_at, "2026-12-31T23:59:59Z");
  assert.deepEqual(db.calls[0], {
    name: "record_annual_sponsorship_payment",
    args: {
      p_reference: "paid-001",
      p_paid_at: "2026-12-31T23:59:59.000Z",
      p_children: [
        { child_id: "child-a", amount: 25, support_type: "monthly" },
      ],
    },
  });
});

test("custom one-time child support records exact cents and rejects amounts below $25", async () => {
  for (const amount of [25, 25.01, 50, 87.65, 300]) {
    const db = database();
    const metadata = {
      ...transaction().metadata,
      frequency: "one-time",
      usd_equivalent: amount,
      children: [{ child_id: "child-a", support_type: "one-time", amount }],
    };
    await recordVerifiedTransaction(
      transaction({ metadata, amount: Math.round(amount * 129 * 100) }),
      db,
    );
    assert.equal(db.donations.get("paid-001").amount, amount);
    assert.equal(db.calls[0].args.p_children[0].amount, amount);
  }
  for (const amount of [0, 24.99, 50.001]) {
    const db = database();
    const metadata = {
      ...transaction().metadata,
      frequency: "one-time",
      usd_equivalent: amount,
      children: [{ child_id: "child-a", support_type: "one-time", amount }],
    };
    await assert.rejects(
      recordVerifiedTransaction(
        transaction({ metadata, amount: Math.round(amount * 129 * 100) }),
        db,
      ),
    );
    assert.equal(db.donations.size, 0);
  }
});

test("missing annual recording migration reports a repairable setup error without legacy downgrade", async () => {
  const db = database({ rpcError: { code: "PGRST202" } });
  await assert.rejects(
    recordVerifiedTransaction(transaction(), db),
    /sponsorship-annual-funding\.sql/,
  );
  assert.equal(db.donations.size, 1);
  assert.equal(db.calls[0].name, "record_annual_sponsorship_payment");
});
test("retries repair allocation failures even after the donation was saved", async () => {
  const db = database({ failRpcOnce: true });
  await assert.rejects(
    recordVerifiedTransaction(transaction(), db),
    /temporary failure/,
  );
  const retry = await recordVerifiedTransaction(transaction(), db);
  assert.equal(retry.alreadyRecorded, true);
  assert.equal(db.donations.size, 1);
  assert.equal(db.calls.length, 2);
  assert.deepEqual(db.calls[0].args, db.calls[1].args);
});
test("webhook and browser verification use the same idempotency reference", async () => {
  const db = database();
  await Promise.all([
    recordVerifiedTransaction(transaction(), db),
    recordVerifiedTransaction(transaction(), db),
  ]);
  assert.equal(db.donations.size, 1);
  assert.equal(db.calls.length, 2);
  assert.deepEqual(db.calls[0], db.calls[1]);
});
test("underpayment, wrong currency, wrong allocations and missing dates cannot fund a child", async () => {
  for (const txn of [
    transaction({ amount: 100 }),
    transaction({ currency: "USD" }),
    transaction({ paid_at: null, created_at: null }),
    transaction({
      metadata: { ...transaction().metadata, usd_equivalent: 300 },
    }),
  ]) {
    const db = database();
    await assert.rejects(recordVerifiedTransaction(txn, db));
    assert.equal(db.donations.size, 0);
    assert.equal(db.calls.length, 0);
  }
});
test("custom donation metadata must match the charge; legacy payments record the real charge", async () => {
  const db = database();
  const meta = {
    giving_model: "donation_v1",
    donation_amount_type: "custom",
    usd_equivalent: 100,
  };
  // Claims $100 but Paystack charged $25 worth of KES.
  await assert.rejects(
    recordVerifiedTransaction(transaction({ metadata: meta }), db),
    /does not match/,
  );
  // Legacy metadata claiming $10 for a $25 charge is recorded at $25.
  await recordVerifiedTransaction(
    transaction({ metadata: { usd_equivalent: 10 } }),
    db,
  );
  assert.equal(db.donations.get("paid-001").amount, 25);
  assert.equal(db.calls.length, 0);
});

test("tampered metadata cannot inflate a donation total", async () => {
  const db = database();
  // Pays KES 1,290 ($10) but claims $1,000.
  await recordVerifiedTransaction(
    transaction({ amount: 10 * 129 * 100, metadata: { usd_equivalent: 1000 } }),
    db,
  );
  assert.equal(db.donations.get("paid-001").amount, 10);
  assert.equal(db.donations.get("paid-001").is_sponsorship, false);
});

test("legacy sponsorship metadata can never create a sponsorship or mark a child sponsored", async () => {
  const db = database(); // fails the test if any table other than donations is touched
  await recordVerifiedTransaction(
    transaction({
      amount: 100, // KES 1
      metadata: {
        donor_id: "donor-a",
        is_sponsorship: true,
        child_id: "child-a",
        usd_equivalent: 300,
        monthly_amount: 25,
      },
    }),
    db,
  );
  const saved = db.donations.get("paid-001");
  assert.equal(saved.amount, 0.01);
  assert.equal(saved.is_sponsorship, false);
  assert.equal(db.calls.length, 0);
});
