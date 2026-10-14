import { createClient } from "@supabase/supabase-js";
import { completeAuthCallback, getAuthCallbackInfo } from "@/lib/authCallback";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
// Capture before SDK initialization can consume or remove callback parameters.
const initialUrl = typeof window !== "undefined" ? window.location.href : "";
export const initialAuthCallback = getAuthCallbackInfo(initialUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: "pkce" },
});

let initialAuthError = null;
// One promise per page load prevents duplicate code exchanges in StrictMode.
export const authReady = completeAuthCallback(supabase, initialUrl, {
  getCurrentUrl: () => window.location.href,
  replaceUrl: (url) =>
    window.history.replaceState(window.history.state, "", url),
}).then((result) => {
  initialAuthError = result.error;
  return result;
});

export function getInitialAuthError() {
  return initialAuthError;
}

export default supabase;
