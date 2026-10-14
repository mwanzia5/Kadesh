import test from "node:test";
import assert from "node:assert/strict";
import {
  getAuthCallbackInfo,
  getCleanAuthCallbackUrl,
  completeAuthCallback,
} from "../src/lib/authCallback.js";

const site = "https://kadesh.example";
const verified = {
  session: { access_token: "verified-access", user: { id: "donor-1" } },
};

function setup(href, overrides = {}) {
  let currentUrl = href;
  const calls = [];
  const auth = {};
  for (const method of [
    "initialize",
    "getSession",
    "setSession",
    "exchangeCodeForSession",
  ]) {
    auth[method] = async (...args) => {
      calls.push({ method, args });
      if (overrides[method]) return overrides[method](...args);
      return method === "initialize"
        ? { error: null }
        : { data: verified, error: null };
    };
  }
  const env = {
    getCurrentUrl: () => currentUrl,
    replaceUrl: (url) => {
      currentUrl = new URL(url, site).toString();
    },
    timeoutMs: 1000,
  };
  return {
    client: { auth },
    calls,
    env,
    getUrl: () => currentUrl,
    setUrl: (url) => {
      currentUrl = url;
    },
  };
}

test("callback metadata never exports access tokens or authorization codes", () => {
  const descriptor = getAuthCallbackInfo(
    `${site}/?code=private-code&redirect=/donate`,
  );
  assert.deepEqual(descriptor, {
    present: true,
    kind: "pkce",
    isRecovery: false,
    redirectTo: "/donate",
  });
  const legacy = getAuthCallbackInfo(
    `${site}/#access_token=private-access&refresh_token=private-refresh`,
  );
  assert.equal(legacy.kind, "legacy");
  assert.doesNotMatch(JSON.stringify(legacy), /private/);
  assert.equal(getAuthCallbackInfo(`${site}/news#story`).present, false);
});

test("ordinary navigation does not delay startup or call authentication", async () => {
  const harness = setup(`${site}/donate?amount=50`);
  assert.deepEqual(
    await completeAuthCallback(harness.client, harness.getUrl(), harness.env),
    { error: null, urlCleaned: true },
  );
  assert.equal(harness.calls.length, 0);
  assert.equal(harness.getUrl(), `${site}/donate?amount=50`);
});

test("callback cleanup routes home to login and rejects external return destinations", () => {
  const cleaned = getCleanAuthCallbackUrl(
    `${site}/?code=secret&redirect=https://evil.example#access_token=private`,
  );
  assert.equal(cleaned, "/donor-auth?mode=login&redirect=%2Faccount");
  assert.doesNotMatch(cleaned, /secret|private|evil/);
  assert.equal(getCleanAuthCallbackUrl(`${site}/#top`), null);
});

test("admin recovery callback cleanup retains the recovery screen", () => {
  const cleaned = getCleanAuthCallbackUrl(
    `${site}/admin/login?mode=recovery&code=secret#access_token=private&refresh_token=secret&type=recovery`,
  );
  assert.equal(cleaned, "/admin/login?mode=recovery");
});

test("successful automatic PKCE exchange is never exchanged twice", async () => {
  const original = `${site}/?code=one-time-code&redirect=/donate`;
  const harness = setup(original, {
    initialize: async () => {
      harness.setUrl(`${site}/?redirect=/donate`);
      return { error: null };
    },
  });
  const result = await completeAuthCallback(
    harness.client,
    original,
    harness.env,
  );
  assert.equal(result.error, null);
  assert.deepEqual(
    harness.calls.map((call) => call.method),
    ["initialize", "getSession"],
  );
  assert.equal(
    harness.getUrl(),
    `${site}/donor-auth?mode=login&redirect=%2Fdonate`,
  );
});

test("an automatic exchange failure is surfaced without retrying the consumed code", async () => {
  const original = `${site}/?code=already-used`;
  const harness = setup(original, {
    initialize: async () => ({ error: { code: "otp_expired" } }),
  });
  const result = await completeAuthCallback(
    harness.client,
    original,
    harness.env,
  );
  assert.match(result.error, /expired or has already been used/);
  assert.deepEqual(
    harness.calls.map((call) => call.method),
    ["initialize"],
  );
  assert.doesNotMatch(harness.getUrl(), /already-used/);
});

test("ignored PKCE callbacks surface the absent browser verifier despite an old session", async () => {
  const original = `${site}/?code=another-browser`;
  const harness = setup(original, {
    exchangeCodeForSession: async () => ({
      data: null,
      error: { code: "pkce_verifier_missing" },
    }),
  });
  const result = await completeAuthCallback(
    harness.client,
    original,
    harness.env,
  );
  assert.match(result.error, /same browser/);
  assert.deepEqual(
    harness.calls.map((call) => call.method),
    ["initialize", "exchangeCodeForSession"],
  );
  assert.deepEqual(harness.calls[1].args, ["another-browser"]);
});

test("legacy implicit links are verified by the SDK without changing new PKCE flows", async () => {
  const original = `${site}/#access_token=old-access&refresh_token=old-refresh&type=magiclink`;
  const harness = setup(original, {
    initialize: async () => ({
      error: { message: "Not a valid PKCE flow url." },
    }),
  });
  const result = await completeAuthCallback(
    harness.client,
    original,
    harness.env,
  );
  assert.equal(result.error, null);
  assert.deepEqual(
    harness.calls.map((call) => call.method),
    ["initialize", "setSession"],
  );
  assert.deepEqual(harness.calls[1].args, [
    { access_token: "old-access", refresh_token: "old-refresh" },
  ]);
  assert.doesNotMatch(harness.getUrl(), /old-access|old-refresh/);
});

test("invalid legacy credentials or missing verified session never count as success", async () => {
  const original = `${site}/#access_token=invalid&refresh_token=invalid`;
  for (const response of [
    { data: null, error: { message: "Invalid token" } },
    { data: { session: null }, error: null },
  ]) {
    const harness = setup(original, { setSession: async () => response });
    const result = await completeAuthCallback(
      harness.client,
      original,
      harness.env,
    );
    assert.match(result.error, /couldn’t complete/);
    assert.equal(result.urlCleaned, true);
  }
});

test("expired-link callback errors are readable and provider messages stay private", async () => {
  const original = `${site}/#error=access_denied&error_code=otp_expired&error_description=private-server-message`;
  const harness = setup(original);
  const result = await completeAuthCallback(
    harness.client,
    original,
    harness.env,
  );
  assert.match(result.error, /expired/);
  assert.doesNotMatch(result.error, /private-server-message/);
  assert.deepEqual(
    harness.calls.map((call) => call.method),
    ["initialize"],
  );
});

test("callback timeout still cleans the URL and provides an error for rendering", async () => {
  const original = `${site}/?code=pending`;
  const harness = setup(original, { initialize: () => new Promise(() => {}) });
  const result = await completeAuthCallback(harness.client, original, {
    ...harness.env,
    timeoutMs: 5,
  });
  assert.match(result.error, /longer than expected/);
  assert.equal(result.urlCleaned, true);
  assert.doesNotMatch(harness.getUrl(), /pending/);
});

test("cleanup failure disables telemetry rather than exposing callback credentials", async () => {
  const original = `${site}/?error=access_denied`;
  const harness = setup(original);
  const result = await completeAuthCallback(harness.client, original, {
    ...harness.env,
    replaceUrl: () => {
      throw new Error("History denied");
    },
  });
  assert.equal(result.urlCleaned, false);
  assert.ok(result.error);
});
