import posthog from "posthog-js";
import {
  hasAuthUrlParameters,
  sanitizeAuthTelemetry,
  sanitizeAuthUrl,
} from "@/lib/authTelemetry";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

export const analyticsEnabled = Boolean(POSTHOG_KEY && POSTHOG_HOST);

export function initAnalytics() {
  if (!analyticsEnabled) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    autocapture: true,
    persistence: "localStorage",
    get_current_url: sanitizeAuthUrl,
    before_send: sanitizeAuthTelemetry,
    // Replay's raw initial-page metadata bypasses event URL scrubbing.
    disable_session_recording: hasAuthUrlParameters(window.location.href),
  });
}

export function trackPageview() {
  if (!analyticsEnabled) return;
  posthog.capture("$pageview");
}

export function identifyDonor(id, email, name) {
  if (!analyticsEnabled) return;
  posthog.identify(id, { email, name });
}

export function captureEvent(event, properties) {
  if (!analyticsEnabled) return;
  posthog.capture(event, properties);
}
