/**
 * UK simplified expenses for vehicles: a flat rate per business mile instead of running costs.
 * Cars and vans: 45p a mile for the first 10,000 business miles in the tax year, then 25p.
 * Motorcycles 24p, bicycles 20p. Illustrative 2026/27 (verify each April). Miles are kept in tenths.
 */
export const MILEAGE = {
  verified: false,
  car: { first: 100_000, rate1: 45, rate2: 25 },
  motorcycle: 24,
  bicycle: 20,
} as const;

export type Vehicle = "car" | "motorcycle" | "bicycle";

/** Pence for a trip of `tenths` miles, when `before` tenths were already driven this tax year. */
export function tripAmount(tenths: number, vehicle: Vehicle, before = 0): number {
  if (tenths <= 0) return 0;
  if (vehicle !== "car") return Math.round((tenths * MILEAGE[vehicle]) / 10);
  const c = MILEAGE.car;
  const atFirst = Math.max(0, Math.min(tenths, c.first - before));
  return Math.round((atFirst * c.rate1 + (tenths - atFirst) * c.rate2) / 10);
}

/** "12.5" or "12" → tenths of a mile; null when it isn't a distance. */
export function parseMiles(s: string): number | null {
  const m = /^\s*(\d{1,5})(?:\.(\d))?\s*$/.exec(s);
  return m ? Number(m[1]) * 10 + Number(m[2] ?? 0) : null;
}

/** "1,250" or "12.5". */
export const showMiles = (tenths: number) => (tenths / 10).toLocaleString("en-GB", { minimumFractionDigits: tenths % 10 ? 1 : 0, maximumFractionDigits: 1 });
