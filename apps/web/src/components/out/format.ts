import { daysBetween, formatDate } from "@/lib/dates";
import type { Tone } from "@/components/ui";

/** Shared, client-safe helpers for the Going out screens. */

/** "SQ *BLUE BOTTLE COFFEE" → "Blue Bottle Coffee", "AMZN MKTP US" → "Amazon". */
export function niceMerchant(raw: string): string {
  let s = raw
    .replace(/^(SQ|TST|SP|PP|PAYPAL)\s*\*\s*/i, "")
    .replace(/\s*\*.*$/, "")
    .replace(/\b(MKTP|MKTPLACE|US|INC|LLC|CO)\b/gi, "")
    .replace(/[#\d]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/^AMZN$/i.test(s)) s = "Amazon";
  if (!s) return raw;
  return s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

export function initials(name: string): string {
  return name
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Due-date badge text and tone: overdue, due soon (within a week) or later. */
export function dueBadge(dueDate: string, today: string): { label: string; tone: Tone } {
  const days = daysBetween(today, dueDate);
  if (days < 0) return { label: `Overdue · was due ${formatDate(dueDate)}`, tone: "late" };
  if (days === 0) return { label: "Due today", tone: "due" };
  if (days <= 7) return { label: `Due soon · ${formatDate(dueDate)}`, tone: "due" };
  return { label: `Due ${formatDate(dueDate)}`, tone: "neutral" };
}
