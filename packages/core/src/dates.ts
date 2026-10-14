/** Dates are ISO strings (YYYY-MM-DD) in the business's calendar. No times, no time zones. */
export type IsoDate = string;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s: unknown): s is IsoDate {
  if (typeof s !== "string" || !ISO.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Today, or BILLINGEASE_TODAY when set (tests and demos). */
export function today(): IsoDate {
  const fixed = typeof process !== "undefined" ? process.env?.BILLINGEASE_TODAY : undefined;
  if (fixed && isIsoDate(fixed)) return fixed;
  return new Date().toISOString().slice(0, 10);
}

export function toUtc(d: IsoDate): Date {
  return new Date(d + "T00:00:00Z");
}

export function fromUtc(d: Date): IsoDate {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: IsoDate, days: number): IsoDate {
  const x = toUtc(d);
  x.setUTCDate(x.getUTCDate() + days);
  return fromUtc(x);
}

export function addMonths(d: IsoDate, months: number): IsoDate {
  const x = toUtc(d);
  const day = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + months);
  const last = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate();
  x.setUTCDate(Math.min(day, last));
  return fromUtc(x);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86400000);
}

export function monthStart(d: IsoDate): IsoDate {
  return d.slice(0, 8) + "01";
}

export function monthEnd(d: IsoDate): IsoDate {
  return addDays(addMonths(monthStart(d), 1), -1);
}

export type Period = { from: IsoDate; to: IsoDate; label: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "11 Oct" or "11 Oct 2026". Day first, as in both countries. */
export function formatDate(d: IsoDate, opts: { year?: boolean } = {}): string {
  const [y, m, day] = d.split("-").map(Number);
  return `${day} ${MONTHS[m - 1]}${opts.year ? " " + y : ""}`;
}

export function monthLabel(d: IsoDate, long = true): string {
  const [y, m] = d.split("-").map(Number);
  return `${(long ? MONTHS_LONG : MONTHS)[m - 1]} ${y}`;
}

export function monthPeriod(d: IsoDate): Period {
  return { from: monthStart(d), to: monthEnd(d), label: monthLabel(d) };
}
