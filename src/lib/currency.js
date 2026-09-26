// Live foreign-exchange rates for the donation form.
//
// Every rate here used to be a hardcoded constant (KES: 129, INR: 83, ...).
// Those had drifted well off the real market — INR was ~15% out, TZS ~6% and
// CDF ~11% — so donors choosing those currencies were quoted a wrong amount
// and the amount recorded against their gift was wrong too.
//
// Rates are fetched from a free, key-less endpoint and cached in localStorage
// so repeat visitors don't refetch. If the network fails we fall back to the
// last known values, then to the original hardcoded ones, so checkout is never
// blocked by a rate lookup.
//
// Convention: every rate is "units of X per 1 USD", matching the API's shape,
// so converting FROM usd is a multiply and TO usd is a divide.

const ENDPOINTS = [
  "https://open.er-api.com/v6/latest/USD",
  "https://api.exchangerate-api.com/v4/latest/USD",
];

// Last-resort values, used only if the network is unavailable and nothing is
// cached. Deliberately conservative and clearly marked as a fallback.
export const FALLBACK_RATES = {
  USD: 1,
  KES: 129,
  UGX: 3750,
  CDF: 2550,
  TZS: 2500,
  INR: 83,
};

// Currencies a donor may pick. Rates for these are refreshed live; the
// `rate` here is only the offline fallback.
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", country: "United States", rate: 1 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", country: "Kenya", rate: 129 },
  { code: "UGX", symbol: "UGX", name: "Ugandan Shilling", country: "Uganda", rate: 3750 },
  { code: "CDF", symbol: "FC", name: "Congolese Franc", country: "DR Congo", rate: 2550 },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", country: "Tanzania", rate: 2500 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", country: "India", rate: 83 },
];

const CACHE_KEY = "khm_fx_rates";
// Rates move slowly; a 6-hour cache keeps a donor's quoted amount stable while
// they fill in the form without going stale for days.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.rates || !parsed?.fetchedAt) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(rates) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ rates, fetchedAt: Date.now() })
    );
  } catch {
    // Private browsing / quota — caching is an optimisation, not a requirement.
  }
}

function pickRates(json) {
  if (json?.rates && typeof json.rates === "object") return json.rates;
  return null;
}

/**
 * Resolve live rates for the currencies we offer.
 * Always resolves — falls back rather than throwing, so a rate outage can
 * never block a donation.
 *
 * @returns {Promise<{rates: Record<string, number>, live: boolean, fetchedAt: number|null}>}
 */
export async function fetchRates() {
  const cached = readCache();
  if (cached) {
    return { rates: { ...FALLBACK_RATES, ...cached.rates }, live: true, fetchedAt: cached.fetchedAt };
  }

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const rates = pickRates(await res.json());
      if (!rates) continue;

      // Only keep what we actually offer, so callers never see undefined.
      const subset = {};
      for (const { code } of CURRENCIES) {
        const v = Number(rates[code]);
        if (Number.isFinite(v) && v > 0) subset[code] = v;
      }
      if (!subset.KES) continue; // KES is required to charge Paystack

      writeCache(subset);
      return {
        rates: { ...FALLBACK_RATES, ...subset },
        live: true,
        fetchedAt: Date.now(),
      };
    } catch {
      // Try the next endpoint.
    }
  }

  return { rates: { ...FALLBACK_RATES }, live: false, fetchedAt: null };
}

/** Units of `code` per 1 USD. */
export function rateFor(rates, code) {
  const r = Number(rates?.[code]);
  return Number.isFinite(r) && r > 0 ? r : FALLBACK_RATES[code] ?? 1;
}

/** Convert an amount denominated in `code` into USD. */
export function toUSD(amount, code, rates) {
  return Number(amount) / rateFor(rates, code);
}

/** Convert USD into an amount denominated in `code`. */
export function fromUSD(usd, code, rates) {
  return Number(usd) * rateFor(rates, code);
}

export function formatCurrency(amount, currency) {
  const decimals = currency.code === "USD" || Number.isInteger(Number(amount)) ? 0 : 2;
  return `${currency.symbol}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
