// Shared search behaviour for the Videos, News and Sponsor-a-Child filters.
//
// Three rules that all three pages now follow, so typing behaves identically
// everywhere:
//   1. Whitespace-only input is treated as "no search". Without trimming,
//      a stray space made every list filter down to zero results.
//   2. Matching is case- and diacritic-insensitive, so "KISANGANI" and
//      "kisangani" both find "Kisangani".
//   3. Every field is null-guarded. A record with a missing title used to
//      throw `Cannot read properties of null` and blank the whole page.

const diacritics = /[\u0300-\u036f]/g;

function fold(value) {
  if (value === null || value === undefined) return "";
  return String(value).normalize("NFKD").replace(diacritics, "").toLowerCase();
}

// Returns the trimmed query, or "" when the user has typed nothing meaningful.
export function normalizeQuery(query) {
  return fold(query).trim();
}

// True when the query is empty, or when any of `fields` contains it.
export function matchesQuery(query, ...fields) {
  const q = normalizeQuery(query);
  if (!q) return true;
  return fields.some((field) => fold(field).includes(q));
}
