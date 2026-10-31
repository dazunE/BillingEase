import { currencyDigits } from "./currencies";

/**
 * Money is always an integer number of minor units: pence for GBP, cents for LKR and USD
 * (and yen for JPY, which has none). Never a float. Rates are basis points (2000 = 20%).
 */
/** A home currency: the currency a business keeps its books in. */
export type Currency = "GBP" | "LKR" | "USD";
/** Any ISO 4217 code a quote, invoice, bill or expense can be written in. */
export type CurrencyCode = string;

const LOCALE: Record<Currency, string> = { GBP: "en-GB", LKR: "en-LK", USD: "en-US" };
const SYMBOL: Record<Currency, string> = { GBP: "£", LKR: "Rs ", USD: "$" };

const isHome = (c: string): c is Currency => c in SYMBOL;

/** The symbol for a currency: £, Rs and $ for home currencies; €, A$, ¥ and so on for others. */
function symbolOf(currency: CurrencyCode): string {
  if (isHome(currency)) return SYMBOL[currency];
  try {
    const part = new Intl.NumberFormat("en-GB", { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency");
    const sym = part?.value ?? currency;
    // A bare code (e.g. "CHF") reads better with a space before the number.
    return /^[A-Z]{3}$/.test(sym) ? `${sym} ` : sym;
  } catch {
    return `${currency} `;
  }
}

/**
 * "£1,250", "Rs 12,500.50", "€980" or "¥120,000". Home currencies use their own locale and
 * symbol; other currencies are written the British way with an unambiguous symbol (US$, A$).
 * `homeOf` tells a non-home business's "$" apart: a UK business invoicing in dollars sees "US$".
 */
export function formatMoney(minor: number, currency: CurrencyCode, opts: { decimals?: "auto" | "always" | "never"; homeOf?: Currency } = {}): string {
  const digits = currencyDigits(currency);
  const unit = 10 ** digits;
  const mode = opts.decimals ?? "auto";
  const showDecimals = digits > 0 && (mode === "always" || (mode === "auto" && minor % unit !== 0));
  const value = Math.abs(minor) / unit;
  const n = new Intl.NumberFormat(isHome(currency) ? LOCALE[currency] : "en-GB", {
    minimumFractionDigits: showDecimals ? digits : 0,
    maximumFractionDigits: showDecimals ? digits : 0,
  }).format(mode === "never" ? Math.round(value) : value);
  const symbol = opts.homeOf && opts.homeOf !== currency && currency === "USD" ? "US$" : symbolOf(currency);
  return (minor < 0 ? "−" : "") + symbol + n;
}

/** The symbol shown in front of an amount field: £, Rs, $, € or the code. */
export function currencySymbol(currency: CurrencyCode): string {
  return symbolOf(currency).trim();
}

/**
 * Parses "1,250", "£1250.5", "Rs 12,500.00", "$1,250", "EUR 40" into minor units of a currency
 * with `digits` decimal places (2 unless said). Null if it isn't an amount.
 */
export function parseMoney(input: string | number | null | undefined, digits = 2): number | null {
  if (input == null) return null;
  const unit = 10 ** digits;
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input * unit) : null;
  // A currency code or symbol may come before or after the number; nothing else may.
  const cleaned = input.replace(/[,\s]/g, "").replace(/^(rs\.?|[a-z]{3}|[a-z]{0,2}[£$€¥₹₨])/i, "").replace(/([a-z]{3}|[£$€¥₹₨])$/i, "");
  const pattern = digits > 0 ? new RegExp(`^\\d+(\\.\\d{1,${digits}})?$`) : /^\d+$/;
  if (!pattern.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * unit + (digits ? Number(frac.padEnd(digits, "0")) : 0);
}

/** A basis-points share of an amount, rounded half away from zero to the minor unit. */
export function applyBps(minor: number, bps: number): number {
  const exact = (minor * bps) / 10000;
  return Math.sign(exact) * Math.round(Math.abs(exact));
}

/** The percentage of an amount, for a business-use share (0–100). */
export function sharePct(minor: number, pct: number): number {
  return applyBps(minor, Math.round(pct * 100));
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
