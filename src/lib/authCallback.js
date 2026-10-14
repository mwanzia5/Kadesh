import { getSafeAuthRedirect } from "./donorAuth.js";

const CALLBACK_KEYS = [
  "code",
  "token_hash",
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
  "expires_in",
  "expires_at",
  "token_type",
  "error",
  "error_code",
  "error_description",
];
const ERROR_KEYS = ["error", "error_code", "error_description"];
export const AUTH_CALLBACK_TIMEOUT_MS = 20000;

function parseCallback(href) {
  try {
    const url = new URL(href);
    const query = url.searchParams;
    const hash = new URLSearchParams(url.hash.slice(1));
    const present = CALLBACK_KEYS.some(
      (key) => query.has(key) || hash.has(key),
    );
    const hasError = ERROR_KEYS.some((key) => query.has(key) || hash.has(key));
    const kind = hasError
      ? "error"
      : hash.has("access_token") || hash.has("refresh_token")
        ? "legacy"
        : query.has("code")
          ? "pkce"
          : present
            ? "unsupported"
            : null;
    return {
      url,
      query,
      hash,
      present,
      kind,
      isRecovery:
        query.get("mode") === "recovery" ||
        query.get("type") === "recovery" ||
        hash.get("type") === "recovery",
      redirectTo: getSafeAuthRedirect(query.get("redirect")),
    };
  } catch {
    return null;
  }
}

// This descriptor contains no code, token, email address, or provider message.
export function getAuthCallbackInfo(href) {
  const parsed = parseCallback(href);
  return {
    present: parsed?.present || false,
    kind: parsed?.kind || null,
    isRecovery: parsed?.isRecovery || false,
    redirectTo: parsed?.redirectTo || "/account",
  };
}

export function getAuthCallbackErrorMessage(error) {
  const code = error?.code || error?.details?.code || "";
  const message = String(error?.message || "").toLowerCase();
  if (code === "callback_timeout")
    return "Sign-in is taking longer than expected. Check your connection and request a new email code if it does not finish.";
  if (code === "otp_expired" || /expired|already.*used/.test(message))
    return "This sign-in link has expired or has already been used. Please request a new email code.";
  if (
    [
      "flow_state_not_found",
      "flow_state_expired",
      "bad_code_verifier",
      "pkce_verifier_missing",
    ].includes(code) ||
    /code verifier|pkce.*verifier/.test(message)
  )
    return "Open this link in the same browser where you requested it, or request a new email code.";
  if (code === "access_denied" || error?.details?.error === "access_denied")
    return "Sign-in was cancelled or denied. Please try again or request a new email code.";
  if (/network|failed to fetch|load failed/.test(message))
    return "We couldn’t connect to finish sign-in. Check your connection and request a new email code.";
  return "We couldn’t complete this sign-in link. Please request a new email code and try again.";
}

export function getCleanAuthCallbackUrl(href) {
  const parsed = parseCallback(href);
  if (!parsed?.present) return null;
  if (parsed.url.pathname.startsWith("/admin/")) {
    for (const key of [...CALLBACK_KEYS, "type"]) {
      parsed.query.delete(key);
      parsed.hash.delete(key);
    }
    if (parsed.isRecovery) parsed.query.set("mode", "recovery");
    parsed.url.hash = parsed.hash.toString();
    return parsed.url.pathname + parsed.url.search + parsed.url.hash;
  }
  const params = new URLSearchParams({
    mode: "login",
    redirect: parsed.redirectTo,
  });
  return `/donor-auth?${params.toString()}`;
}

function requireSession(data) {
  if (!data?.session?.access_token || !data.session.user?.id) {
    throw Object.assign(new Error("No verified session returned"), {
      code: "callback_session_missing",
    });
  }
}

export async function completeAuthCallback(
  client,
  href,
  {
    getCurrentUrl = () => href,
    replaceUrl = () => {},
    timeoutMs = AUTH_CALLBACK_TIMEOUT_MS,
  } = {},
) {
  const parsed = parseCallback(href);
  if (!parsed?.present) return { error: null, urlCleaned: true };
  let timedOut = false;
  let timer;
  let error = null;
  let urlCleaned = false;

  const finish = async () => {
    const initialized = await client.auth.initialize();
    if (timedOut) return;
    if (parsed.kind === "error") {
      throw {
        code:
          parsed.query.get("error_code") ||
          parsed.hash.get("error_code") ||
          parsed.query.get("error") ||
          parsed.hash.get("error"),
        message: "Authentication callback failed",
      };
    }
    if (parsed.kind === "legacy") {
      const access_token = parsed.hash.get("access_token");
      const refresh_token = parsed.hash.get("refresh_token");
      if (!access_token || !refresh_token)
        throw new Error("Incomplete legacy callback");
      // Public SDK validation imports older implicit email links while all new
      // requests retain PKCE. Never decode a token into a locally trusted user.
      const result = await client.auth.setSession({
        access_token,
        refresh_token,
      });
      if (result.error) throw result.error;
      requireSession(result.data);
      return;
    }
    if (initialized?.error) throw initialized.error;
    if (parsed.kind !== "pkce") throw new Error("Unsupported callback");

    // Auto detection ignores a code when this browser lacks the saved verifier.
    // An explicit SDK exchange surfaces that error. A failed auto exchange is
    // never retried, and a successful one already removed the code from the URL.
    const remainingCode = new URL(getCurrentUrl()).searchParams.get("code");
    if (remainingCode) {
      const result = await client.auth.exchangeCodeForSession(
        parsed.query.get("code"),
      );
      if (result.error) throw result.error;
      requireSession(result.data);
      return;
    }
    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    requireSession(result.data);
  };

  try {
    await Promise.race([
      finish(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          reject(
            Object.assign(new Error("Callback timed out"), {
              code: "callback_timeout",
            }),
          );
        }, timeoutMs);
      }),
    ]);
  } catch (failure) {
    error = getAuthCallbackErrorMessage(failure);
  } finally {
    clearTimeout(timer);
    try {
      replaceUrl(getCleanAuthCallbackUrl(href));
      urlCleaned = true;
    } catch {
      error ||=
        "We couldn’t finish sign-in. Open the login page and request a new email code.";
    }
  }
  return { error, urlCleaned };
}
