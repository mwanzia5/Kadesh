import { useEffect, useRef } from "react";

// Cloudflare Turnstile bot check for Supabase Auth (CAPTCHA protection).
// Set VITE_TURNSTILE_SITE_KEY to turn it on. Without a key nothing renders and
// auth requests are sent exactly as before, so this can ship before the
// Supabase "Enable CAPTCHA protection" toggle is switched on.
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
export const CAPTCHA_ENABLED = Boolean(TURNSTILE_SITE_KEY);

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise = null;

function loadTurnstile() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () =>
        window.turnstile
          ? resolve(window.turnstile)
          : reject(new Error("Turnstile failed to initialise"));
      script.onerror = () => {
        scriptPromise = null; // allow a retry on the next mount
        reject(new Error("Turnstile failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Renders the Turnstile check and reports its token through `onToken`.
 * Tokens are single-use: change `resetKey` after every auth request so a
 * fresh token is issued for the next one.
 */
export default function TurnstileWidget({
  onToken,
  resetKey = 0,
  action,
  className = "",
}) {
  const container = useRef(null);
  const widgetId = useRef(null);
  const tokenCallback = useRef(onToken);
  tokenCallback.current = onToken;

  useEffect(() => {
    if (!CAPTCHA_ENABLED) return undefined;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        widgetId.current = turnstile.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          size: "flexible",
          callback: (token) => tokenCallback.current?.(token),
          "expired-callback": () => tokenCallback.current?.(null),
          "error-callback": () => {
            tokenCallback.current?.(null);
            return true; // let Turnstile retry on its own
          },
        });
      })
      .catch(() => tokenCallback.current?.(null));
    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* widget already gone */
        }
      }
      widgetId.current = null;
      tokenCallback.current?.(null);
    };
  }, [action]);

  useEffect(() => {
    if (!resetKey || widgetId.current === null || !window.turnstile) return;
    tokenCallback.current?.(null);
    try {
      window.turnstile.reset(widgetId.current);
    } catch {
      /* widget not ready yet */
    }
  }, [resetKey]);

  if (!CAPTCHA_ENABLED) return null;
  return <div ref={container} className={"min-h-[65px] " + className} />;
}
