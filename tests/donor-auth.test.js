import test from "node:test";
import assert from "node:assert/strict";
import {
  OTP_RESEND_SECONDS,
  normalizeEmail,
  getSafeAuthRedirect,
  getAuthErrorMessage,
  createDonorAuthActions,
  loadDonorProfile,
} from "../src/lib/donorAuth.js";

const origin = "https://kadesh.example";
const donor = {
  id: "donor-1",
  email: "donor@example.com",
  user_metadata: { first_name: "Amina", last_name: "Otieno" },
};
const session = { access_token: "verified-token", user: donor };

function authClient(responses = {}) {
  const calls = [];
  const client = { auth: {} };
  for (const method of ["signInWithOtp", "verifyOtp", "signInWithOAuth"]) {
    client.auth[method] = async (args) => {
      calls.push({ method, args });
      return (
        responses[method] || {
          data:
            method === "signInWithOAuth"
              ? { url: "https://auth.example/authorize?provider=google" }
              : { session, user: donor },
          error: null,
        }
      );
    };
  }
  return { client, calls, actions: createDonorAuthActions(client) };
}

function profileClient(reads, insertResult) {
  const calls = [];
  let nextRead = 0;
  const client = {
    from(table) {
      assert.equal(table, "donor_profiles");
      return {
        select(columns) {
          assert.equal(columns, "*");
          return {
            eq(key, id) {
              assert.equal(key, "id");
              assert.equal(id, donor.id);
              return {
                async maybeSingle() {
                  calls.push({ kind: "read", id });
                  assert.ok(nextRead < reads.length, "unexpected profile read");
                  return reads[nextRead++];
                },
              };
            },
          };
        },
        insert(payload) {
          calls.push({ kind: "insert", payload });
          return {
            select() {
              return {
                async single() {
                  return insertResult || { data: payload, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
  return { client, calls };
}

test("email normalization is stable and does not accept missing input", () => {
  assert.equal(
    normalizeEmail("  Amina+Giving@Example.COM  "),
    "amina+giving@example.com",
  );
  assert.equal(normalizeEmail(null), "");
  assert.equal(OTP_RESEND_SECONDS, 60);
});

test("donor redirects preserve legitimate checkout parameters", () => {
  for (const path of [
    "/account",
    "/donate?amount=50&child=child-1",
    "/sponsor-a-child",
    "/sponsor-a-child/checkout",
    "/sponsor-a-child/child-1#give",
  ]) {
    assert.equal(getSafeAuthRedirect(path), path);
  }
  assert.equal(getSafeAuthRedirect(null, "/donate"), "/donate");
});

test("redirects reject external destinations, admin paths, traversal and malformed input", () => {
  for (const path of [
    "https://attacker.example/donate",
    "//attacker.example",
    "/\\attacker.example",
    "javascript:alert(1)",
    "/admin",
    "/donor-auth",
    "/accounting",
    "/account/../admin",
    "/%2f%2fattacker.example",
    "/sponsor-a-child/%2e%2e/admin",
    "/donate\n",
    "/sponsor-a-child/../admin",
    " /donate",
    42,
    null,
    {},
    "",
  ])
    assert.equal(getSafeAuthRedirect(path), "/account", String(path));
  assert.equal(
    getSafeAuthRedirect("//attacker.example", "//fallback.example"),
    "/account",
  );
});

test("login sends an email code without creating users or overwriting metadata", async () => {
  const { actions, calls } = authClient();
  await actions.sendEmailCode({
    email: " DONOR@EXAMPLE.COM ",
    origin,
    firstName: "Ignore",
    redirectTo: "/donate?child=a&amount=50",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "signInWithOtp");
  assert.equal(calls[0].args.email, donor.email);
  assert.equal(calls[0].args.options.shouldCreateUser, false);
  assert.equal("data" in calls[0].args.options, false);
  const callback = new URL(calls[0].args.options.emailRedirectTo);
  assert.equal(callback.origin, origin);
  assert.equal(callback.pathname, "/donor-auth");
  assert.equal(callback.searchParams.get("mode"), "login");
  assert.equal(
    callback.searchParams.get("redirect"),
    "/donate?child=a&amount=50",
  );
});

test("signup sends trimmed profile names and explicitly permits account creation", async () => {
  const { actions, calls } = authClient();
  await actions.sendEmailCode({
    email: donor.email,
    mode: "signup",
    firstName: " Amina ",
    lastName: " Otieno ",
    origin,
  });
  assert.deepEqual(calls[0].args.options.data, {
    first_name: "Amina",
    last_name: "Otieno",
  });
  assert.equal(calls[0].args.options.shouldCreateUser, true);
});

test("invalid email, mode and callback origin never reach the auth provider", async () => {
  const { actions, calls } = authClient();
  for (const email of [
    "",
    "bad",
    "two@@example.com",
    "x @example.com",
    `${"x".repeat(250)}@example.com`,
  ]) {
    await assert.rejects(actions.sendEmailCode({ email, origin }), {
      code: "invalid_email",
    });
  }
  await assert.rejects(
    actions.sendEmailCode({ email: donor.email, mode: "recovery", origin }),
    { code: "invalid_mode" },
  );
  await assert.rejects(
    actions.sendEmailCode({
      email: donor.email,
      origin: "javascript:alert(1)",
    }),
    { code: "invalid_origin" },
  );
  assert.equal(calls.length, 0);
});

test("verification supports leading zeroes and configurable 6–10 digit email codes", async () => {
  const { actions, calls } = authClient();
  for (const token of ["012345", "0123456789"]) {
    const data = await actions.verifyEmailCode({
      email: " DONOR@EXAMPLE.COM ",
      token: ` ${token} `,
    });
    assert.equal(data.session, session);
    assert.deepEqual(calls.at(-1).args, {
      email: donor.email,
      token,
      type: "email",
    });
  }
});

test("invalid codes are rejected locally and cannot create an authenticated UI", async () => {
  const { actions, calls } = authClient();
  for (const token of [
    "",
    "12345",
    "12345678901",
    "123abc",
    "123 456",
    123456,
    null,
  ]) {
    await assert.rejects(
      actions.verifyEmailCode({ email: donor.email, token }),
      { code: "invalid_otp_format" },
    );
  }
  assert.equal(calls.length, 0);
  for (const data of [
    { user: donor, session: null },
    { session: {} },
    { session: { access_token: "token" } },
  ]) {
    const missing = authClient({ verifyOtp: { data, error: null } });
    await assert.rejects(
      missing.actions.verifyEmailCode({ email: donor.email, token: "123456" }),
      { code: "session_missing" },
    );
  }
});

test("provider errors propagate through sending, verification and Google sign-in", async () => {
  const error = { code: "over_request_rate_limit", status: 429 };
  const response = { data: null, error };
  const { actions } = authClient({
    signInWithOtp: response,
    verifyOtp: response,
    signInWithOAuth: response,
  });
  for (const operation of [
    () => actions.sendEmailCode({ email: donor.email, origin }),
    () => actions.verifyEmailCode({ email: donor.email, token: "123456" }),
    () => actions.signInWithGoogle({ origin }),
  ])
    await assert.rejects(operation, (received) => received === error);
});

test("Google uses a safe same-origin callback and retains checkout intent", async () => {
  const { actions, calls } = authClient();
  await actions.signInWithGoogle({
    origin,
    redirectTo: "/sponsor-a-child/checkout",
  });
  assert.equal(calls[0].args.provider, "google");
  assert.equal(
    new URL(calls[0].args.options.redirectTo).searchParams.get("redirect"),
    "/sponsor-a-child/checkout",
  );
  await actions.signInWithGoogle({
    origin,
    redirectTo: "https://attacker.example",
  });
  assert.equal(
    new URL(calls[1].args.options.redirectTo).searchParams.get("redirect"),
    "/account",
  );
});

test("auth errors give actionable messages without echoing raw provider internals", () => {
  assert.match(getAuthErrorMessage({ status: 429 }), /temporarily limited/);
  assert.match(
    getAuthErrorMessage({ code: "otp_expired" }, "verify"),
    /latest code/,
  );
  assert.match(
    getAuthErrorMessage({ code: "provider_disabled" }, "google"),
    /continue with your email/,
  );
  assert.match(
    getAuthErrorMessage({ code: "email_address_not_authorized" }),
    /delivery is not ready/,
  );
  assert.match(
    getAuthErrorMessage({ message: "Failed to fetch" }),
    /internet connection/,
  );
  assert.match(
    getAuthErrorMessage({ code: "user_not_found" }),
    /Create an account/,
  );
  assert.match(
    getAuthErrorMessage({
      code: "signup_disabled",
      message: "Signups not allowed for otp",
    }),
    /Create an account/,
  );
  assert.doesNotMatch(
    getAuthErrorMessage({ message: "secret backend internals" }),
    /secret|backend|internals/,
  );
});

test("Google sign-in rejects a success response without a provider redirect", async () => {
  const { actions } = authClient({
    signInWithOAuth: { data: { provider: "google", url: null }, error: null },
  });
  await assert.rejects(actions.signInWithGoogle({ origin }), {
    code: "provider_redirect_missing",
  });
});

test("existing profile values are retained without any write", async () => {
  const saved = {
    id: donor.id,
    first_name: "Saved",
    last_name: "Name",
    email: donor.email,
    phone: "+254123",
    location: "Nairobi",
  };
  const { client, calls } = profileClient([{ data: saved, error: null }]);
  assert.deepEqual(await loadDonorProfile(client, donor), saved);
  assert.deepEqual(calls, [{ kind: "read", id: donor.id }]);
});

test("a failed profile lookup never creates or overwrites a profile", async () => {
  const error = { code: "42501", message: "Access denied" };
  const { client, calls } = profileClient([{ data: null, error }]);
  await assert.rejects(
    loadDonorProfile(client, donor),
    (received) => received === error,
  );
  assert.equal(calls.filter((call) => call.kind === "insert").length, 0);
});

test("new profiles derive names from verified user's metadata", async () => {
  const { client, calls } = profileClient([{ data: null, error: null }]);
  const profile = await loadDonorProfile(client, {
    ...donor,
    user_metadata: { full_name: "Amina Grace Otieno" },
  });
  assert.equal(profile.first_name, "Amina");
  assert.equal(profile.last_name, "Grace Otieno");
  assert.equal(profile.email, donor.email);
  assert.equal(calls[1].payload.id, donor.id);
});

test("Google name fallbacks fill null trigger fields without replacing saved blank names", async () => {
  const googleUser = { ...donor, user_metadata: { full_name: "Amina Otieno" } };
  const { client, calls } = profileClient([
    {
      data: { id: donor.id, first_name: null, last_name: "", email: null },
      error: null,
    },
  ]);
  const profile = await loadDonorProfile(client, googleUser);
  assert.equal(profile.first_name, "Amina");
  assert.equal(profile.last_name, "");
  assert.equal(profile.email, donor.email);
  assert.equal(calls.length, 1);
});

test("a concurrent profile insert reloads the winner without an upsert", async () => {
  const saved = {
    id: donor.id,
    first_name: "Saved",
    last_name: "Profile",
    email: donor.email,
  };
  const { client, calls } = profileClient(
    [
      { data: null, error: null },
      { data: saved, error: null },
    ],
    { data: null, error: { code: "23505" } },
  );
  assert.deepEqual(await loadDonorProfile(client, donor), saved);
  assert.deepEqual(
    calls.map((call) => call.kind),
    ["read", "insert", "read"],
  );
});

test("profile insert and race read failures remain visible to the caller", async () => {
  const error = { code: "42501", message: "Access denied" };
  const denied = profileClient([{ data: null, error: null }], {
    data: null,
    error,
  });
  await assert.rejects(
    loadDonorProfile(denied.client, donor),
    (received) => received === error,
  );
  const raced = profileClient(
    [
      { data: null, error: null },
      { data: null, error },
    ],
    { data: null, error: { code: "23505" } },
  );
  await assert.rejects(
    loadDonorProfile(raced.client, donor),
    (received) => received === error,
  );
});
