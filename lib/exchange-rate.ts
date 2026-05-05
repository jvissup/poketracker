// Fetches the live USD → CAD exchange rate from frankfurter.app
// (same underlying data source as Google Finance — ECB + market rates)
// Results are cached for 1 hour via Next.js fetch cache.

export interface ExchangeRateResult {
  rate: number;       // e.g. 1.3654
  date: string;       // e.g. "2024-05-04"
  source: string;     // attribution string for display
}

const FALLBACK_RATE = 1.37; // safe fallback if API is unreachable

export async function getUsdToCadRate(): Promise<ExchangeRateResult> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=CAD",
      {
        next: { revalidate: 3600 }, // cache 1 hour
      }
    );

    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);

    const data = await res.json();
    const rate: number = data.rates?.CAD;

    if (!rate || typeof rate !== "number") {
      throw new Error("Unexpected exchange rate response shape");
    }

    return {
      rate,
      date: data.date ?? new Date().toISOString().slice(0, 10),
      source: "frankfurter.app (ECB)",
    };
  } catch (err) {
    console.warn("[exchange-rate] Failed to fetch live rate, using fallback:", err);
    return {
      rate: FALLBACK_RATE,
      date: new Date().toISOString().slice(0, 10),
      source: "fallback",
    };
  }
}

/** Convert a USD amount to CAD */
export function usdToCAD(usdAmount: number | null | undefined, rate: number): number | null {
  if (usdAmount == null) return null;
  return usdAmount * rate;
}
