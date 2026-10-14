import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "framer-motion";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import { initMonitoring } from "./lib/monitoring";
import { authReady, initialAuthCallback } from "./supabase/client";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function renderApplication({ urlCleaned = true } = {}) {
  // Older emails can return session credentials in the URL. Auth startup must
  // consume and remove those before telemetry or router initialization.
  if (urlCleaned) {
    initAnalytics();
    initMonitoring();
  }
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <MotionConfig reducedMotion="user">
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </QueryClientProvider>
        </HelmetProvider>
      </MotionConfig>
    </React.StrictMode>,
  );
}

if (initialAuthCallback.present) {
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.textContent = "Completing sign-in…";
  status.style.cssText =
    "padding:3rem;text-align:center;font-family:system-ui,sans-serif";
  document.getElementById("root").replaceChildren(status);
  // The bootstrap has a bounded timeout; a failed callback still opens the
  // login page with a readable error and a way to request another code.
  authReady.then(renderApplication, () =>
    renderApplication({ urlCleaned: false }),
  );
} else {
  renderApplication();
}
