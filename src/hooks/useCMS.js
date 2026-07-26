import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "khm_cms_content";

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getCMSContent(pageId, sectionId, defaultValue = "") {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (all[pageId] && all[pageId][sectionId] !== undefined && all[pageId][sectionId] !== null && all[pageId][sectionId] !== "") {
      return all[pageId][sectionId];
    }
  } catch {}
  return defaultValue;
}

export function useCMS(pageId) {
  const [content, setContent] = useState({});

  const refresh = useCallback(() => {
    setContent(loadAll()[pageId] || {});
  }, [pageId]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  const get = useCallback(
    (sectionId, defaultValue = "") => {
      const val = content[sectionId];
      if (val !== undefined && val !== null && val !== "") return val;
      return defaultValue;
    },
    [content]
  );

  const getAll = useCallback(() => content, [content]);

  return { get, getAll, refresh };
}
