export const OTP_RESEND_SECONDS = 60;

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function authError(code, message) {
  return Object.assign(new Error(message), { code });
}

function validatedEmail(value) {
  const email = normalizeEmail(value);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw authError("invalid_email", "Enter a valid email address.");
  }
  return email;
}

function safeDonorPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\s\u0000-\u001f\u007f]/.test(value) ||
    /%(?:2f|5c|2e|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)
  )
    return null;
  try {
    const url = new URL(value, "https://kadesh.invalid");
    if (
      url.origin !== "https://kadesh.invalid" ||
      !/^\/(?:account\/?|donate\/?|sponsor-a-child(?:\/[a-zA-Z0-9_-]+)?\/?)$/.test(
        url.pathname,
      )
    )
      return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getSafeAuthRedirect(value, fallback = "/account") {
  return safeDonorPath(value) || safeDonorPath(fallback) || "/account";
}

function authCallbackUrl(redirectTo, suppliedOrigin) {
  const origin =
    suppliedOrigin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  let url;
  try {
    url = new URL(origin);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password)
      throw new Error("Invalid origin");
  } catch {
    throw authError("invalid_origin", "The sign-in return address is invalid.");
  }
  const callback = new URL("/donor-auth", url.origin);
  callback.searchParams.set("mode", "login");
  callback.searchParams.set("redirect", getSafeAuthRedirect(redirectTo));
  return callback.toString();
}

export function getAuthErrorMessage(error, action = "send") {
  const code = error?.code || "";
  const message = String(error?.message || "").toLowerCase();
  if (
    error?.status === 429 ||
    [
      "over_email_send_rate_limit",
      "over_request_rate_limit",
      "over_sms_send_rate_limit",
    ].includes(code) ||
    /rate limit|too many requests|security purposes/.test(message)
  ) {
    return "Email requests are temporarily limited. Please wait before trying again. If this continues, contact our team.";
  }
  if (code === "captcha_failed" || /captcha/.test(message))
    return "The security check didn’t pass. Please complete it again and retry.";
  if (["invalid_email", "email_address_invalid"].includes(code))
    return "Enter a valid email address.";
  if (code === "invalid_otp_format")
    return "Enter the 6–10 digit code from your email.";
  if (
    [
      "otp_expired",
      "otp_disabled",
      "invalid_token",
      "bad_code_verifier",
    ].includes(code)
  ) {
    return "That code is invalid or has expired. Try the latest code, or request a new one.";
  }
  if (["provider_disabled", "unsupported_provider"].includes(code))
    return "Google sign-in is unavailable right now. Please continue with your email.";
  if (
    code === "email_address_not_authorized" ||
    /email.*not authorized/.test(message)
  )
    return "Email delivery is not ready yet. Please contact Kadesh for help signing in.";
  if (
    code === "user_not_found" ||
    /signups not allowed.*otp|user not found/.test(message)
  )
    return "We couldn’t send a sign-in code. Check your email address or choose Create an account.";
  if (["email_provider_disabled", "signup_disabled"].includes(code)) {
    return action === "google"
      ? "Google sign-in is unavailable right now. Please continue with your email."
      : "Email sign-in is unavailable right now. Please contact Kadesh for help.";
  }
  if (code === "session_missing")
    return "Sign-in did not finish. Please request a new code and try again.";
  if (
    ["request_timeout", "unexpected_failure"].includes(code) ||
    /failed to fetch|network|load failed|timeout/.test(message)
  )
    return "We couldn’t connect. Check your internet connection and try again.";
  if (action === "verify")
    return "We couldn’t verify your code. Check the latest email and try again.";
  if (action === "google")
    return "Google sign-in could not start. Please try again or continue with your email.";
  return "We couldn’t send your code. Please try again in a moment.";
}

export function createDonorAuthActions(client) {
  return {
    async sendEmailCode({
      email,
      mode = "login",
      firstName = "",
      lastName = "",
      redirectTo,
      origin,
      captchaToken,
    }) {
      if (!["login", "signup"].includes(mode))
        throw authError("invalid_mode", "Choose sign in or create an account.");
      const options = {
        shouldCreateUser: mode === "signup",
        emailRedirectTo: authCallbackUrl(redirectTo, origin),
      };
      // Required by Supabase once CAPTCHA protection is enabled.
      if (captchaToken) options.captchaToken = captchaToken;
      if (mode === "signup")
        options.data = {
          first_name: String(firstName).trim().slice(0, 100),
          last_name: String(lastName).trim().slice(0, 100),
        };
      const { data, error } = await client.auth.signInWithOtp({
        email: validatedEmail(email),
        options,
      });
      if (error) throw error;
      return data;
    },

    async verifyEmailCode({ email, token }) {
      const normalizedToken = typeof token === "string" ? token.trim() : "";
      if (!/^\d{6,10}$/.test(normalizedToken))
        throw authError(
          "invalid_otp_format",
          "Enter the code from your email.",
        );
      const { data, error } = await client.auth.verifyOtp({
        email: validatedEmail(email),
        token: normalizedToken,
        type: "email",
      });
      if (error) throw error;
      if (!data?.session?.access_token || !data.session.user?.id)
        throw authError("session_missing", "Sign-in did not return a session.");
      return data;
    },

    async signInWithGoogle({ redirectTo, origin } = {}) {
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authCallbackUrl(redirectTo, origin),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      if (typeof data?.url !== "string" || !data.url)
        throw authError(
          "provider_redirect_missing",
          "Google sign-in did not return a sign-in address.",
        );
      return data;
    },
  };
}

function profileDefaults(user) {
  const metadata = user.user_metadata || {};
  const fullName = String(metadata.full_name || metadata.name || "").trim();
  const [givenName = "", ...familyName] = fullName.split(/\s+/);
  return {
    id: user.id,
    first_name: metadata.first_name || metadata.given_name || givenName,
    last_name:
      metadata.last_name || metadata.family_name || familyName.join(" "),
    email: user.email || "",
    phone: metadata.phone || null,
    location: metadata.location || null,
  };
}

function withProfileDefaults(profile, user) {
  const defaults = profileDefaults(user);
  // The signup trigger predates Google sign-in, so its name fields may be null.
  // Keep these fallbacks in memory; never overwrite the donor's saved values.
  return {
    ...profile,
    first_name: profile.first_name ?? defaults.first_name,
    last_name: profile.last_name ?? defaults.last_name,
    email: profile.email || defaults.email,
  };
}

export async function loadDonorProfile(client, user) {
  const readProfile = () =>
    client.from("donor_profiles").select("*").eq("id", user.id).maybeSingle();
  const existing = await readProfile();
  if (existing.error) throw existing.error;
  if (existing.data) return withProfileDefaults(existing.data, user);
  // A simultaneous tab or database trigger may win the insert. A duplicate
  // requires a fresh read, never an upsert that could erase existing details.
  const inserted = await client
    .from("donor_profiles")
    .insert(profileDefaults(user))
    .select("*")
    .single();
  if (inserted.error?.code === "23505") {
    const raced = await readProfile();
    if (raced.error) throw raced.error;
    if (raced.data) return withProfileDefaults(raced.data, user);
  } else if (inserted.error) throw inserted.error;
  else if (inserted.data) return withProfileDefaults(inserted.data, user);
  throw authError("profile_missing", "Your profile could not be loaded.");
}
