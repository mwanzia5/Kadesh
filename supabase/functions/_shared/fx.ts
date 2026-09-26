// supabase/functions/_shared/fx.ts
//
// Single source of truth for foreign-exchange conversion on the server.
//
// The rates used to be hardcoded (KES: 129, INR: 83, TZS: 2500, ...). Those had
// drifted materially off the real market — INR ~15% out, TZS ~6%, CDF ~11% —
// so a donor picking those currencies was quoted a wrong KES amount and the
// amount stored against their gift was wrong with it.
//
// Rates are fetched live, cached briefly, and the exact rate used is snapshotted
// onto each donation so historical figures never shift when rates move.
//
// Every rate is "units of X per 1 USD", which is the shape both providers
// return, so USD -> X is a multiply and X -> USD is a divide.

const ENDPOINTS = [
  "https://open.er-api.com/v6/latest/USD",
  "https://api.exchangerate-api.com/v4/latest/USD",
];

// Offline fallback. Only used if every provider is unreachable AND nothing is
// cached — better to quote a slightly stale rate than to block a donation.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  KES: 129,
  UGX: 3750,
  CDF: 2550,
  TZS: 2500,
  INR: 83,
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type FxResult = {
  rates: Record<string, number>;
  source: string;
  live: boolean;
  fetchedAt: string | null;
};

let cache: FxResult | null = null;

function pickRates(json: any): Record<string, number> | null {
  const raw = json?.rates;
  if (!raw || typeof raw !== "object") return null;

  const out: Record<string, number> = {};
  for (const [code, value] of Object.entries(raw)) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) out[code.toUpperCase()] = n;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Resolve live USD-base rates. Never throws — a rate outage must not be able to
 * stop someone donating.
 */
export async function getRates(): Promise<FxResult> {
  if (cache && Date.now() - new Date(cache.fetchedAt ?? 0).getTime() < CACHE_TTL_MS) {
    return cache;
  }

  for (const url of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;

      const rates = pickRates(await res.json());
      if (!rates?.KES) continue; // KES is required to charge Paystack

      cache = {
        rates: { ...FALLBACK_RATES, ...rates },
        source: new URL(url).host,
        live: true,
        fetchedAt: new Date().toISOString(),
      };
      return cache;
    } catch {
      // Try the next provider.
    }
  }

  // Keep any previously cached rates (even if stale) ahead of the hardcoded
  // fallback — a rate from six hours ago beats one baked into the source.
  if (cache) return { ...cache, live: false };

  return {
    rates: { ...FALLBACK_RATES },
    source: "static-fallback",
    live: false,
    fetchedAt: null,
  };
}

/** Units of `code` per 1 USD. */
export function rateFor(rates: Record<string, number>, code: string): number {
  const r = Number(rates[code?.toUpperCase()]);
  return Number.isFinite(r) && r > 0 ? r : FALLBACK_RATES[code?.toUpperCase()] ?? 1;
}

/** Convert an amount in `code` to USD. */
export function toUSD(amount: number, code: string, rates: Record<string, number>): number {
  return Number(amount) / rateFor(rates, code);
}

/** Convert USD into `code`. */
export function fromUSD(usd: number, code: string, rates: Record<string, number>): number {
  return Number(usd) * rateFor(rates, code);
}
