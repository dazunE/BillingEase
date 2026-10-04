/** Money helpers. Amounts are always integer cents. */

export function formatMoney(cents: number, opts: { cents?: boolean; currency?: string } = {}): string {
  const value = cents / 100;
  const showCents = opts.cents ?? cents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency ?? "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(value);
}

/** Parses user input like "1,250", "$1250.5" or "12.99" into cents. Returns null if invalid. */
export function parseMoney(input: string | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = String(input).replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** Rounds a basis-points share of an amount to the nearest cent. */
export function shareOf(cents: number, bps: number): number {
  return Math.round((cents * bps) / 10000);
}
