/**
 * Money is always an integer number of minor units: pence for GBP, cents for LKR and USD.
 * Never a float. Rates are basis points (2000 = 20%).
 */
export type Currency = "GBP" | "LKR" | "USD";

const LOCALE: Record<Currency, string> = { GBP: "en-GB", LKR: "en-LK", USD: "en-US" };
const SYMBOL: Record<Currency, string> = { GBP: "£", LKR: "Rs ", USD: "$" };

export function formatMoney(minor: number, currency: Currency, opts: { decimals?: "auto" | "always" | "never" } = {}): string {
  const mode = opts.decimals ?? "auto";
  const showDecimals = mode === "always" || (mode === "auto" && minor % 100 !== 0);
  const value = Math.abs(minor) / 100;
  const n = new Intl.NumberFormat(LOCALE[currency], {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(mode === "never" ? Math.round(value) : value);
  return (minor < 0 ? "−" : "") + SYMBOL[currency] + n;
}

/** The symbol shown in front of an amount field: £, Rs or $. */
export function currencySymbol(currency: Currency): string {
  return SYMBOL[currency].trim();
}

/** Parses "1,250", "£1250.5", "Rs 12,500.00", "$1,250" into minor units. Null if it isn't an amount. */
export function parseMoney(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input * 100) : null;
  const cleaned = input.replace(/(rs\.?|lkr|gbp|usd|£|\$|,|\s)/gi, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
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
