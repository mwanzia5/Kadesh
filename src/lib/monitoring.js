import * as Sentry from "@sentry/react";
import {
  hasAuthUrlParameters,
  sanitizeAuthTelemetry,
} from "@/lib/authTelemetry";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const monitoringEnabled = Boolean(SENTRY_DSN);

export function initMonitoring() {
  if (!SENTRY_DSN) return;
  // Initial DOM replay metadata cannot be scrubbed by Sentry's event hooks.
  const authCallback = hasAuthUrlParameters(window.location.href);
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.PROD ? "production" : "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      ...(!authCallback
        ? [
            Sentry.replayIntegration({
              beforeAddRecordingEvent: sanitizeAuthTelemetry,
            }),
          ]
        : []),
    ],
    beforeSend: sanitizeAuthTelemetry,
    beforeSendTransaction: sanitizeAuthTelemetry,
    beforeSendSpan: sanitizeAuthTelemetry,
    beforeBreadcrumb: sanitizeAuthTelemetry,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: authCallback ? 0 : 1.0,
  });
}

export { Sentry };
