import { currencyDigits } from "./currencies";

/**
 * Exchange rates. A rate is a decimal string: how many units of the home currency one unit of
 * the document's currency is worth ("0.7912" means 1 USD = 0.7912 GBP). Strings and BigInt keep
 * it exact; it never passes through a float on its way to an amount.
 */
export type Rate = string;

/** Rates keep 10 decimal places: enough for JPY → GBP (about 0.005) to stay accurate. */
export const RATE_DP = 10;
// BigInt() rather than literals (10n) so the web app's older compile target accepts it.
const B0 = BigInt(0), B1 = BigInt(1), B2 = BigInt(2), B10 = BigInt(10);
const pow10 = (n: number) => { let v = B1; for (let i = 0; i < n; i++) v *= B10; return v; };
const SCALE = pow10(RATE_DP);

export class FxError extends Error {}

/** Rounds a non-negative scaled division half away from zero. */
function divRound(num: bigint, den: bigint): bigint {
  const neg = num < B0 !== den < B0;
  const a = num < B0 ? -num : num;
  const b = den < B0 ? -den : den;
  const q = (a * B2 + b) / (B2 * b);
  return neg ? -q : q;
}

/** "0.79120" → 7912000000n (scaled by 10^10). Null if it isn't a rate above zero. */
function scaled(rate: string | number): bigint | null {
  const s = typeof rate === "number" ? (Number.isFinite(rate) ? rate.toFixed(12) : "") : rate.trim().replace(/,/g, "");
  const m = /^(\d{1,12})(?:\.(\d+))?$/.exec(s);
  if (!m) return null;
  const frac = m[2] ?? "";
  const kept = BigInt(m[1] + frac.slice(0, RATE_DP).padEnd(RATE_DP, "0"));
  // Round the 11th decimal place.
  const v = frac.length > RATE_DP && Number(frac[RATE_DP]) >= 5 ? kept + B1 : kept;
  return v > B0 ? v : null;
}

function fromScaled(v: bigint): Rate {
  const s = v.toString().padStart(RATE_DP + 1, "0");
  const whole = s.slice(0, -RATE_DP);
  const frac = s.slice(-RATE_DP).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/** Tidies a rate typed by a person or read from a rates service. Null if it isn't above zero. */
export function parseRate(input: string | number | null | undefined): Rate | null {
  if (input == null || input === "") return null;
  const v = scaled(input);
  return v == null ? null : fromScaled(v);
}

/** The rate for the other direction: 1 / rate, to 10 decimal places. */
export function invertRate(rate: Rate): Rate {
  const v = scaled(rate);
  if (v == null) throw new FxError(`Not a rate: ${rate}`);
  return fromScaled(divRound(SCALE * SCALE, v));
}

/**
 * Turns an amount in one currency's minor units into another's, at `rate` (units of `to` per
 * unit of `from`), rounded half away from zero. Minor units are adjusted for currencies with
 * other than two decimal places (JPY has none).
 */
export function convertMinor(minor: number, from: string, to: string, rate: Rate): number {
  if (!Number.isInteger(minor)) throw new FxError("Amounts are whole minor units.");
  if (from === to) return minor;
  const r = scaled(rate);
  if (r == null) throw new FxError(`Not a rate: ${rate}`);
  const shift = currencyDigits(to) - currencyDigits(from);
  const num = BigInt(minor) * r * pow10(Math.max(0, shift));
  const den = SCALE * pow10(Math.max(0, -shift));
  return Number(divRound(num, den));
}

/** "1 USD = 0.7912 GBP", to at most 6 significant decimals. */
export function describeRate(from: string, to: string, rate: Rate): string {
  const n = Number(rate);
  const dp = n >= 1 ? 4 : Math.min(RATE_DP, 4 - Math.floor(Math.log10(n)));
  const shown = n.toFixed(dp).replace(/\.?0+$/, "");
  return `1 ${from} = ${shown} ${to}`;
}

export type HomeTotals = { net: number; vat: number; sscl: number; total: number };

/**
 * A document's totals in the home currency. Each part is converted and the total is their sum,
 * so the ledger entry built from them balances to the penny.
 */
export function toHome(t: { net: number; vat: number; sscl?: number }, from: string, home: string, rate: Rate): HomeTotals {
  const net = convertMinor(t.net, from, home, rate);
  const vat = convertMinor(t.vat, from, home, rate);
  const sscl = convertMinor(t.sscl ?? 0, from, home, rate);
  return { net, vat, sscl, total: net + vat + sscl };
}

/**
 * How much of a document's home-currency value a payment or credit clears. A part settlement
 * clears its share at the document's own rate; the one that finishes it clears whatever is left,
 * so the receivable (or payable) always ends at exactly zero.
 */
export function homeCleared(x: { total: number; settledBefore: number; amount: number; homeTotal: number; homeClearedBefore: number }): number {
  const left = x.homeTotal - x.homeClearedBefore;
  if (x.settledBefore + x.amount >= x.total) return left;
  if (x.total <= 0) return 0;
  const share = Number(divRound(BigInt(x.amount) * BigInt(x.homeTotal), BigInt(x.total)));
  return Math.min(Math.max(share, 0), left);
}
