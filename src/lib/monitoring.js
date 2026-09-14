import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const monitoringEnabled = Boolean(SENTRY_DSN);

export function initMonitoring() {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.PROD ? "production" : "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      // Session Replay. Sampled to error sessions only (see the replays*
      // rates below), so replays are captured when something breaks.
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };