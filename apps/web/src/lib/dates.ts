/** Date helpers. Dates are handled as ISO `YYYY-MM-DD` strings in the business's local calendar. */

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "Today", overridable with BILLINGEASE_TODAY=YYYY-MM-DD for demos and tests. */
export function today(): string {
  return process.env.BILLINGEASE_TODAY ?? toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function startOfMonth(iso: string): string {
  return iso.slice(0, 8) + "01";
}

export function endOfMonth(iso: string): string {
  const d = new Date(iso.slice(0, 8) + "01T12:00:00");
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return toIsoDate(d);
}

export function startOfQuarter(iso: string): string {
  const m = Number(iso.slice(5, 7));
  const q = Math.floor((m - 1) / 3) * 3 + 1;
  return `${iso.slice(0, 4)}-${String(q).padStart(2, "0")}-01`;
}

export function endOfQuarter(iso: string): string {
  const start = startOfQuarter(iso);
  const d = new Date(start + "T12:00:00");
  d.setMonth(d.getMonth() + 3);
  d.setDate(0);
  return toIsoDate(d);
}

export function startOfYear(iso: string): string {
  return iso.slice(0, 4) + "-01-01";
}

export function endOfYear(iso: string): string {
  return iso.slice(0, 4) + "-12-31";
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T12:00:00").getTime();
  const b = new Date(toIso + "T12:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", opts);
}

/** Next US federal estimated-tax due date on or after `iso`. */
export function nextEstimatedTaxDue(iso: string): string {
  const y = Number(iso.slice(0, 4));
  const candidates = [`${y}-04-15`, `${y}-06-15`, `${y}-09-15`, `${y + 1}-01-15`];
  return candidates.find((d) => d >= iso) ?? `${y + 1}-04-15`;
}
