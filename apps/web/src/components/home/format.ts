import { formatMoney, type Currency } from "@billingease/core";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Sunday 11 October". */
export function longDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Whole units on the big numbers: "£1,240". */
export const whole = (minor: number, currency: Currency) => formatMoney(minor, currency, { decimals: "never" });

/** "in 9 days", "today", "3 days ago". */
export function inDays(n: number): string {
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** "just now", "5 min ago", "3 hours ago", "2 days ago". */
export function ago(isoTime: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(isoTime).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) { const h = Math.floor(s / 3600); return `${h} hour${h === 1 ? "" : "s"} ago`; }
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
