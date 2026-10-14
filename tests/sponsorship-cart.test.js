import test from "node:test";
import assert from "node:assert/strict";
import {
  addSponsorshipChild,
  changeSponsorshipFrequency,
  getSponsorshipSubtotal,
  normalizeSponsorshipItem,
  restoreSponsorshipCart,
  validateSponsorshipAllocation,
} from "../src/lib/sponsorship.js";

const child = (id) => ({ id, first_name: `Child ${id}` });
const emptyCart = () => ({ frequency: "one-time", items: [] });
const saveAndReload = (cart) =>
  restoreSponsorshipCart(JSON.parse(JSON.stringify({ version: 3, ...cart })));

test("selecting an existing child does not duplicate or reset checkout choices", () => {
  const cart = addSponsorshipChild(emptyCart(), child("a"), "monthly");
  assert.strictEqual(addSponsorshipChild(cart, child("a")), cart);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.frequency, "monthly");
});

test("monthly renewal remains explicit and preserves other selected children", () => {
  let cart = addSponsorshipChild(emptyCart(), child("a"), "education");
  cart = addSponsorshipChild(cart, child("b"));
  cart = addSponsorshipChild(cart, child("a"), "monthly");
  assert.equal(cart.items.length, 2);
  assert.equal(cart.frequency, "monthly");
  assert.ok(
    cart.items.every(
      (item) => item.support_type === "monthly" && item.amount === 25,
    ),
  );
  assert.equal(cart.items[0].one_time_type, "education");
  assert.equal(
    validateSponsorshipAllocation(cart.items, 50, "monthly").length,
    2,
  );
});

test("a newly selected child starts on Education fees ($100)", () => {
  const cart = addSponsorshipChild(emptyCart(), child("a"));
  assert.equal(cart.frequency, "one-time");
  assert.deepEqual(
    cart.items.map(({ support_type, amount }) => ({ support_type, amount })),
    [{ support_type: "education", amount: 100 }],
  );
});

test("donor can choose Education, Supplies, Meals ($100) or Full ($300)", () => {
  let cart = emptyCart();
  cart = addSponsorshipChild(cart, child("a"), "education");
  cart = addSponsorshipChild(cart, child("b"), "supplies");
  cart = addSponsorshipChild(cart, child("c"), "meals");
  cart = addSponsorshipChild(cart, child("d"), "full");
  assert.deepEqual(
    cart.items.map((item) => [item.support_type, item.amount]),
    [
      ["education", 100],
      ["supplies", 100],
      ["meals", 100],
      ["full", 300],
    ],
  );
  assert.equal(getSponsorshipSubtotal(cart.items), 600);
  assert.equal(
    validateSponsorshipAllocation(cart.items, 600, "one-time").length,
    4,
  );
});

test("monthly support is $25 or $50 per child", () => {
  let cart = addSponsorshipChild(emptyCart(), child("a"), "monthly", 50);
  cart = addSponsorshipChild(cart, child("b"));
  assert.equal(cart.frequency, "monthly");
  assert.deepEqual(
    cart.items.map((item) => item.amount),
    [50, 25],
  );
  assert.equal(getSponsorshipSubtotal(cart.items), 75);
  assert.equal(validateSponsorshipAllocation(cart.items, 75, "monthly").length, 2);
  // Anything other than $25/$50 falls back to $25.
  const odd = normalizeSponsorshipItem({
    child_id: "x",
    support_type: "monthly",
    monthly_amount: 30,
  });
  assert.equal(odd.amount, 25);
});

test("plans and monthly amounts survive frequency switches and reloads", () => {
  let cart = addSponsorshipChild(emptyCart(), child("a"), "meals");
  cart = addSponsorshipChild(cart, child("b"), "full");
  cart = addSponsorshipChild(cart, child("a"), "monthly", 50);
  assert.deepEqual(
    cart.items.map((item) => item.amount),
    [50, 25],
  );
  const back = saveAndReload({
    frequency: "one-time",
    items: changeSponsorshipFrequency(cart.items, "one-time"),
  });
  assert.deepEqual(
    back.items.map((item) => [item.support_type, item.amount]),
    [
      ["meals", 100],
      ["full", 300],
    ],
  );
  const monthlyAgain = changeSponsorshipFrequency(back.items, "monthly");
  assert.deepEqual(
    monthlyAgain.map((item) => item.amount),
    [50, 25],
  );
});

test("old carts with a custom one-time amount move to Education fees ($100)", () => {
  const cart = restoreSponsorshipCart([
    { child_id: "a", first_name: "A", support_type: "one-time", one_time_amount: "72.50" },
    { child_id: "a", first_name: "Duplicate", support_type: "full" },
    { child_id: "b", support_type: "supplies", amount: 1 },
    null,
    { amount: 50 },
  ]);
  assert.equal(cart.frequency, "one-time");
  assert.deepEqual(
    cart.items.map((item) => [item.support_type, item.amount]),
    [
      ["education", 100],
      ["supplies", 100],
    ],
  );
  assert.equal(cart.items[0].first_name, "A");
  assert.deepEqual(restoreSponsorshipCart(null), emptyCart());
  assert.deepEqual(restoreSponsorshipCart({ items: "invalid" }), emptyCart());
});

test("invalid child and plan requests leave the cart unchanged", () => {
  const cart = addSponsorshipChild(emptyCart(), child("a"));
  assert.strictEqual(addSponsorshipChild(cart, null), cart);
  assert.strictEqual(addSponsorshipChild(cart, { id: 123 }), cart);
  assert.strictEqual(addSponsorshipChild(cart, child("b"), "invalid"), cart);
});

