import { addDays, parseRate, invertRate, type Rate } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { fxRates } from "@billingease/db/schema";
import { and, eq } from "drizzle-orm";
import type { Config } from "../config";

/**
 * Reads one day's rate from a rates service: units of `quote` per unit of `base`. Null when the
 * service has no rate for that day (a weekend, a holiday, a day not yet published). Throws when
 * the service can't be reached at all, so the lookup stops instead of trying more days.
 */
export type RateSource = (base: string, quote: string, day: string) => Promise<number | string | null>;

export type FoundRate = { rate: Rate; day: string; source: string };

export type FxService = {
  /**
   * The rate to turn `from` into `to` on `day`: from the cache, else the rates service (looking
   * back up to four days for a weekend or holiday). Null when no rate can be found; the person
   * then types one.
   */
  rate(db: Exec, from: string, to: string, day: string): Promise<FoundRate | null>;
};

const LOOK_BACK_DAYS = 4;

/**
 * Free daily reference rates (no key) from the fawazahmed0 currency-api, which covers LKR as well
 * as the major currencies. The jsDelivr copy is tried first, then the Cloudflare one.
 */
export function currencyApiSource(opts: { urls?: string[]; timeoutMs?: number } = {}): RateSource {
  const urls = opts.urls ?? [
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{day}/v1/currencies/{base}.min.json",
    "https://{day}.currency-api.pages.dev/v1/currencies/{base}.min.json",
  ];
  return async (base, quote, day) => {
    const b = base.toLowerCase();
    let reached = false;
    for (const template of urls) {
      const url = template.replace("{day}", day).replace("{base}", b);
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(opts.timeoutMs ?? 4000), headers: { accept: "application/json" } });
        reached = true;
        if (!res.ok) continue;
        const body = (await res.json()) as Record<string, unknown>;
        const table = body[b] as Record<string, unknown> | undefined;
        const v = table?.[quote.toLowerCase()];
        if (typeof v === "number" && v > 0) return v;
      } catch {
        // Try the next copy.
      }
    }
    if (!reached) throw new Error("The rates service can't be reached.");
    return null;
  };
}

export function createFx(config: Config, source: RateSource | null = config.fx.enabled ? currencyApiSource() : null, name = "currency-api"): FxService {
  return {
    async rate(db, from, to, day) {
      if (from === to) return { rate: "1", day, source: "same" };
      let online = !!source;
      for (let back = 0; back <= LOOK_BACK_DAYS; back++) {
        const d = addDays(day, -back);
        const cached = await fromCache(db, from, to, d);
        if (cached) return { rate: cached, day: d, source: "cache" };
        if (!online || !source) continue;
        let raw: number | string | null;
        try {
          raw = await source(from, to, d);
        } catch {
          // Unreachable: stop asking, but earlier days may still be in the cache.
          online = false;
          continue;
        }
        const rate = parseRate(raw);
        if (rate) {
          await db.insert(fxRates).values({ day: d, base: from, quote: to, rate, source: name }).onConflictDoNothing();
          return { rate, day: d, source: name };
        }
      }
      return null;
    },
  };
}

async function fromCache(db: Exec, from: string, to: string, day: string): Promise<Rate | null> {
  const [direct] = await db.select({ rate: fxRates.rate }).from(fxRates).where(and(eq(fxRates.day, day), eq(fxRates.base, from), eq(fxRates.quote, to)));
  if (direct) return parseRate(direct.rate);
  const [inverse] = await db.select({ rate: fxRates.rate }).from(fxRates).where(and(eq(fxRates.day, day), eq(fxRates.base, to), eq(fxRates.quote, from)));
  return inverse ? invertRate(parseRate(inverse.rate)!) : null;
}

/** Fixed rates for tests and demos: units of the quote per unit of the base, e.g. { "USD/GBP": "0.79" }. */
export function fixedRates(table: Record<string, string | number>): RateSource {
  return async (base, quote) => table[`${base}/${quote}`] ?? (table[`${quote}/${base}`] != null ? invertRate(String(parseRate(table[`${quote}/${base}`]))) : null);
}
