import { useState, useEffect, useCallback } from "react";
import { getAllPageContent } from "@/services/pageContent";
import { cmsDefault } from "@/content/cmsFields";

// Local-storage key is a same-session cache/fallback so a refresh doesn't flash
// hardcoded defaults while the Supabase fetch is in flight — it is not the
// source of truth.
const CACHE_KEY = "khm_cms_cache";

let memoryCache = {};
let hasFetched = false;
let fetchPromise = null;
// Monotonic token so a slow in-flight fetch can never overwrite the result of a
// newer one (admin saves call primeCMSCache(true) while a page-load fetch may
// still be running).
let fetchToken = 0;

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

  const token = ++fetchToken;

  fetchPromise = getAllPageContent()
    .then(({ data, error }) => {
      // A newer fetch started while this one was in flight — discard this
      // result so the last write always wins.
      if (token !== fetchToken) return;

      if (!error && data) {
        memoryCache = buildMap(data);
        hasFetched = true;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
        } catch {
          // ignore storage quota / privacy-mode errors
        }
        notify();
      } else {
        // Mark as attempted either way so useCMS/useCMSReady stop retrying on
        // every mount. We keep whatever is already in memoryCache (the
        // localStorage seed, or the last good response) rather than blanking
        // the site out.
        hasFetched = true;
      }
    })
    .catch(() => {
      if (token === fetchToken) hasFetched = true;
    })
    .finally(() => {
      // Allow a later primeCMSCache() call to start a fresh request instead of
      // handing back this settled promise forever.
      if (token === fetchToken) fetchPromise = null;
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

// `page_content.content` is JSONB, so a value saved as a string comes back as a
// string — but guard anyway. Rendering a raw object/array into JSX throws
// "Objects are not valid as a React child", which would take down a whole page
// because of one bad row. Coerce anything non-string to text instead.
function toText(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join("\n\n");
  return "";
}

export function getCMSContent(pageId, sectionId, defaultValue = "") {
  const raw = memoryCache[pageId]?.[sectionId];
  if (raw !== undefined && raw !== null && raw !== "") {
    const text = toText(raw);
    if (text !== "") return text;
  }
  return defaultValue;
}

// The function every page should use. Reads the admin override when one exists
// and otherwise falls back to the default in src/content/cmsFields.js — the
// same entry the admin UI renders an editor for, so the two can never disagree.
//
// Callers must render inside a component that has called useCMSReady() (directly
// or via useCMS) so the tree re-renders when content arrives or is saved.
export function cmsText(pageId, sectionId) {
  return getCMSContent(pageId, sectionId, cmsDefault(pageId, sectionId));
}

// Multi-line CMS fields are stored as a single string. Split on blank lines so
// an admin can write several paragraphs in one textarea.
export function cmsParagraphs(pageId, sectionId) {
  return cmsText(pageId, sectionId)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
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

// Call this once near the top of any page/component that reads content with
// cmsText() or getCMSContent() so it re-renders when the Supabase fetch resolves
// and whenever an admin saves (the "cms:updated" event).
export function useCMSReady() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handler = () => forceRender((n) => n + 1);
    window.addEventListener("cms:updated", handler);
    if (!hasFetched) primeCMSCache();
    return () => window.removeEventListener("cms:updated", handler);
  }, []);
}
