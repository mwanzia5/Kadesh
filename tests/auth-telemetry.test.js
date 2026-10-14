import test from "node:test";
import assert from "node:assert/strict";
import {
  hasAuthUrlParameters,
  sanitizeAuthTelemetry,
  sanitizeAuthUrl,
} from "../src/lib/authTelemetry.js";

test("scrubs PKCE query and legacy OAuth fragment credentials while preserving route state", () => {
  const url =
    "https://kadesh.test/donor-auth?mode=login&redirect=%2Faccount&code=private-code#access_token=private-access&refresh_token=private-refresh&provider_token=private-google&provider_refresh_token=private-google-refresh&expires_in=3600";
  const clean = sanitizeAuthUrl(url);
  assert.equal(
    clean,
    "https://kadesh.test/donor-auth?mode=login&redirect=%2Faccount&code=[REDACTED]#access_token=[REDACTED]&refresh_token=[REDACTED]&provider_token=[REDACTED]&provider_refresh_token=[REDACTED]&expires_in=3600",
  );
  assert.equal(hasAuthUrlParameters(url), true);
  assert.equal(
    url.includes("private-access"),
    true,
    "does not alter the source URL",
  );
});

test("scrubs recovery tokens, template tokens and callback error descriptions", () => {
  const value =
    "/admin/login?mode=recovery&token_hash=private-hash&token=private-token&id_token=private-id&error_description=private-error";
  assert.equal(
    sanitizeAuthUrl(value),
    "/admin/login?mode=recovery&token_hash=[REDACTED]&token=[REDACTED]&id_token=[REDACTED]&error_description=[REDACTED]",
  );
});

test("handles repeated, case-insensitive and encoded parameter names", () => {
  assert.equal(
    sanitizeAuthUrl("/login?%63ode=one&CODE=two&code=three#ACCESS_TOKEN=four"),
    "/login?%63ode=[REDACTED]&CODE=[REDACTED]&code=[REDACTED]#ACCESS_TOKEN=[REDACTED]",
  );
});

test("scrubs encoded callback URLs inside redirect and referrer parameters", () => {
  const inner =
    "https://kadesh.test/login?code=nested-secret&redirect=%2Faccount";
  const input = "/return?redirect=" + encodeURIComponent(inner);
  const output = sanitizeAuthUrl(input);
  assert.equal(
    decodeURIComponent(output.split("redirect=")[1]),
    "https://kadesh.test/login?code=[REDACTED]&redirect=%2Faccount",
  );
  assert.equal(output.includes("nested-secret"), false);
});

test("cleans URLs throughout events, spans, breadcrumbs and error text without mutating them", () => {
  const url = "https://kadesh.test/login?code=never-log-this";
  const event = {
    event: "$pageview",
    properties: { $current_url: url, $referrer: url, amount: 50 },
    request: { url },
    breadcrumbs: [{ data: { from: url, to: "/account" } }],
    spans: [{ description: "GET " + url }],
    exception: { values: [{ value: "Navigation failed for " + url }] },
  };
  const cleaned = sanitizeAuthTelemetry(event);
  assert.equal(JSON.stringify(cleaned).includes("never-log-this"), false);
  assert.equal(event.request.url, url);
  assert.equal(cleaned.properties.amount, 50);
  assert.equal(cleaned.breadcrumbs[0].data.to, "/account");
});

test("ordinary analytics values and URLs are unchanged", () => {
  const values = [
    "https://kadesh.test/donate?amount=25&currency=USD#giving",
    "/account",
    "Donation completed",
    "https://kadesh.test/news?category=kids",
    null,
    undefined,
    0,
  ];
  for (const value of values) {
    assert.equal(sanitizeAuthUrl(value), value);
    assert.equal(hasAuthUrlParameters(value), false);
  }
  const event = {
    event: "donation_completed",
    properties: { amount: 25, currency: "USD", enabled: true },
  };
  assert.deepEqual(sanitizeAuthTelemetry(event), event);
});

test("malformed escapes and cyclic event structures do not throw", () => {
  assert.equal(
    sanitizeAuthUrl("/login?%E0%A4=unchanged&code=secret"),
    "/login?%E0%A4=unchanged&code=[REDACTED]",
  );
  const input = { url: "/login?code=secret" };
  input.self = input;
  const output = sanitizeAuthTelemetry(input);
  assert.equal(output.self, output);
  assert.equal(output.url, "/login?code=[REDACTED]");
});
