import posthog from "posthog-js";

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