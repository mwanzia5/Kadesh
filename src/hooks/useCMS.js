import { useState, useEffect, useCallback } from "react";
import { getAllPageContent } from "@/services/pageContent";

// Local-storage key is now just a same-session cache/fallback so a
// refresh doesn't flash hardcoded defaults while the Supabase fetch
// is in flight — it is no longer the source of truth.
const CACHE_KEY = "khm_cms_cache";

let memoryCache = {};
let hasFetched = false;
let fetchPromise = null;

function buildMap(rows) {
  const map = {};
  for (const row of rows || []) {
    if (!map[row.page_slug]) map[row.page_slug] = {};
    map[row.page_slug][row.section_key] = row.content;
  }
  return map;
}

function notify() {
  window.dispatchEvent(new Event("cms:updated"));
}

// Seed from the same-session cache immediately (synchronous), then
// kick off the real Supabase fetch. force=true re-fetches even if a
// fetch already ran — call this after an admin save so the cache
// reflects the change right away.
export function primeCMSCache(force = false) {
  if (fetchPromise && !force) return fetchPromise;

  fetchPromise = getAllPageContent().then(({ data, error }) => {
    if (!error && data) {
      memoryCache = buildMap(data);
      hasFetched = true;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
      } catch {
        // ignore storage quota / privacy-mode errors
      }
      notify();
    }
  });

  return fetchPromise;
}

try {
  memoryCache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
} catch {
  memoryCache = {};
}

// Kick off the real fetch as soon as this module loads.
primeCMSCache();

export function getCMSContent(pageId, sectionId, defaultValue = "") {
  const val = memoryCache[pageId]?.[sectionId];
  if (val !== undefined && val !== null && val !== "") return val;
  return defaultValue;
}

// For pages that already use the hook-based get()/getAll() API.
export function useCMS(pageId) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handler = () => forceRender((n) => n + 1);
    window.addEventListener("cms:updated", handler);
    if (!hasFetched) primeCMSCache();
    return () => window.removeEventListener("cms:updated", handler);
  }, []);

  const get = useCallback(
    (sectionId, defaultValue = "") => getCMSContent(pageId, sectionId, defaultValue),
    [pageId]
  );
  const getAll = useCallback(() => memoryCache[pageId] || {}, [pageId]);
  const refresh = useCallback(() => primeCMSCache(true), []);

  return { get, getAll, refresh };
}

// NEW — for pages like Home.jsx that call getCMSContent(...) directly
// inline in JSX instead of via useCMS(pageId). Call this once near the
// top of the page component so it re-renders once the Supabase fetch
// resolves (or whenever the cache is refreshed elsewhere).
export function useCMSReady() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handler = () => forceRender((n) => n + 1);
    window.addEventListener("cms:updated", handler);
    return () => window.removeEventListener("cms:updated", handler);
  }, []);
}