import test from "node:test";
import assert from "node:assert/strict";
import { fetchAnnualFunding } from "../src/lib/annualFunding.js";
import { sponsorshipSelectionError } from "../supabase/functions/_shared/sponsorship-rules.js";

const child = { id: "child-a", sponsorship_status: "available" };
const selection = { child_id: child.id, support_type: "education", amount: 100 };
function client({
  annual = { data: null, error: { code: "PGRST202" } },
  children = { data: [child], error: null },
  throwRpc = false,
} = {}) {
  return {
    rpc(name, args) {
      assert.equal(name, "get_child_annual_funding");
      assert.deepEqual(args, { p_year: 2026 });
      if (throwRpc) throw new Error("network unavailable");
      return annual;
    },
    from(table) {
      assert.equal(table, "children");
      return {
        select(fields) {
          assert.equal(fields, "id, sponsorship_status");
          return children;
        },
      };
    },
  };
}

test("annual totals come from the aggregate RPC when present", async () => {
  const row = {
    child_id: child.id,
    funded_amount: "100",
    pending: false,
    legacy_reserved: false,
  };
  const data = await fetchAnnualFunding(
    client({ annual: { data: [row], error: null } }),
    2026,
  );
  assert.deepEqual(data[child.id], { ...row, funding_available: true });
});

test("a missing, failed, malformed or timed-out annual RPC falls back to fresh child availability", async () => {
  for (const options of [
    {},
    { throwRpc: true },
    { annual: { data: null, error: null } },
    { annual: { data: [], error: null } },
    {
      annual: {
        data: [{ child_id: child.id, funded_amount: "invalid" }],
        error: null,
      },
    },
    { annual: new Promise(() => {}) },
  ]) {
    const data = await fetchAnnualFunding(client(options), 2026, {}, 5);
    assert.equal(data[child.id].funding_available, false);
    assert.equal(data[child.id].funded_amount, null);
    assert.equal(data[child.id].child_status, "available");
    assert.equal(sponsorshipSelectionError(selection, data[child.id]), null);
  }
});

test("fallback preserves fresh status, cached funding limits and known restrictions", async () => {
  for (const status of ["pending", "sponsored", "unknown"]) {
    const data = await fetchAnnualFunding(
      client({
        children: { data: [{ ...child, sponsorship_status: status }] },
      }),
      2026,
    );
    assert.ok(sponsorshipSelectionError(selection, data[child.id]));
  }
  for (const cached of [
    { funded_amount: 300 },
    { funded_amount: 275 },
    { legacy_reserved: true },
    { pending: true },
  ]) {
    const data = await fetchAnnualFunding(client(), 2026, {
      [child.id]: cached,
    });
    assert.ok(sponsorshipSelectionError(selection, data[child.id]));
  }
  const data = await fetchAnnualFunding(
    client({
      annual: {
        data: [{ child_id: child.id, pending: true, funded_amount: null }],
      },
    }),
    2026,
  );
  assert.ok(sponsorshipSelectionError(selection, data[child.id]));
});

test("checkout cannot proceed if both metadata and real child availability fail", async () => {
  for (const children of [
    { data: null, error: new Error("availability failed") },
    { data: null, error: null },
    new Promise(() => {}),
  ]) {
    await assert.rejects(fetchAnnualFunding(client({ children }), 2026, {}, 5));
  }
  const data = await fetchAnnualFunding(
    client({ children: { data: [] } }),
    2026,
  );
  assert.ok(sponsorshipSelectionError(selection, data[child.id]));
});

test("partial metadata keeps valid funding restrictions and fills missing children from availability", async () => {
  const full = {
    child_id: "full-child",
    funded_amount: 300,
    pending: false,
    legacy_reserved: false,
  };
  const rows = [
    { ...child },
    { id: "full-child", sponsorship_status: "available" },
  ];
  const data = await fetchAnnualFunding(
    client({
      annual: {
        data: [
          full,
          { child_id: "broken-child", funded_amount: null, pending: true },
        ],
      },
      children: { data: rows },
    }),
    2026,
  );
  assert.equal(data[child.id].funded_amount, null);
  assert.equal(sponsorshipSelectionError(selection, data[child.id]), null);
  assert.match(
    sponsorshipSelectionError(
      { ...selection, child_id: "full-child" },
      data["full-child"],
    ),
    /support for this year is complete/i,
  );
});

test("a complete available funding row remains usable during an independent status outage", async () => {
  const row = {
    child_id: child.id,
    funded_amount: 0,
    pending: false,
    legacy_reserved: false,
  };
  const data = await fetchAnnualFunding(
    client({
      annual: { data: [row] },
      children: { error: new Error("status outage") },
    }),
    2026,
  );
  assert.equal(sponsorshipSelectionError(selection, data[child.id]), null);
  assert.ok(sponsorshipSelectionError(selection, data["unknown-child"]));
});
