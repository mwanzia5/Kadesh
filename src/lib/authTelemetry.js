const AUTH_PARAMETERS = new Set([
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "id_token",
  "provider_token",
  "provider_refresh_token",
  "error_description",
]);
const REDACTED = "[REDACTED]";

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Scrub telemetry copies only. Supabase must still receive the original URL. */
export function sanitizeAuthUrl(value) {
  if (typeof value !== "string") return value;
  function scrub(text, depth) {
    return text.replace(
      /([?&#])([^=?&#\s]+)=([^&#\s]*)/g,
      (match, separator, key, content) => {
        if (AUTH_PARAMETERS.has(decode(key).toLowerCase()))
          return `${separator}${key}=${REDACTED}`;
        // Callback URLs may themselves be encoded inside redirect/referrer values.
        if (depth < 3 && content.includes("%")) {
          const decoded = decode(content);
          const cleaned = scrub(decoded, depth + 1);
          if (cleaned !== decoded)
            return `${separator}${key}=${encodeURIComponent(cleaned)}`;
        }
        return match;
      },
    );
  }
  return scrub(value, 0);
}

export function hasAuthUrlParameters(value) {
  return typeof value === "string" && sanitizeAuthUrl(value) !== value;
}

/** Handles URL properties, navigation breadcrumbs, spans and exception messages. */
export function sanitizeAuthTelemetry(event) {
  const seen = new WeakMap();
  function clean(value) {
    if (typeof value === "string") return sanitizeAuthUrl(value);
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return seen.get(value);
    if (
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    )
      return value;
    const result = Array.isArray(value) ? [...value] : { ...value };
    seen.set(value, result);
    for (const key of Object.keys(result)) result[key] = clean(result[key]);
    return result;
  }
  return clean(event);
}
