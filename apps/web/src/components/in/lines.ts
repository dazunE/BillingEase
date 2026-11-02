import type { Item } from "@billingease/contracts";

/** Editor lines as typed (strings), and how they are made. Shared by server pages and the editor. */
export type LineState = {
  key: string; itemId: string | null; description: string; qty: string; price: string; discount: string; vatRateId: string | null; sscl: boolean;
  /** Time and materials: which section, and for time, the date and who did it. */
  section?: "time" | "materials" | null; workDate?: string; person?: string;
  /** Materials: what they cost you and the markup in percent; the price is then worked out. */
  cost?: string; markup?: string;
};

let k = 0;
const key = () => `l${Date.now().toString(36)}${k++}`;
/** Minor units as typed in a field, with the currency's decimal places (2, or 0 for JPY). */
export const decimal = (minor: number, digits = 2) => (minor / 10 ** digits).toFixed(digits);

/** A price-list item as a line. `price` overrides the list price (e.g. converted to the document's currency). */
export function lineFromItem(i: Item, price?: string): LineState {
  return { key: key(), itemId: i.id, description: i.name, qty: "1", price: price ?? decimal(i.unitPrice), discount: "", vatRateId: i.vatRateId, sscl: i.sscl };
}
export function blankLine(defaultVat: string | null, section: "time" | "materials" | null = null, today?: string): LineState {
  return { key: key(), itemId: null, description: "", qty: "1", price: "", discount: "", vatRateId: defaultVat, sscl: true, section, workDate: section === "time" ? (today ?? "") : "", person: "", cost: "", markup: "" };
}
export function lineFromStored(l: {
  itemId?: string | null; description: string; quantityMilli: number; unitPrice: number; discount?: number; vatRateId?: string | null; sscl?: boolean;
  section?: "time" | "materials" | null; workDate?: string | null; person?: string | null; costPrice?: number | null; markupBps?: number | null;
}, digits = 2): LineState {
  return {
    key: key(), itemId: l.itemId ?? null, description: l.description, qty: String(l.quantityMilli / 1000), price: decimal(l.unitPrice, digits), discount: l.discount ? decimal(l.discount, digits) : "", vatRateId: l.vatRateId ?? null, sscl: l.sscl !== false,
    section: l.section ?? null, workDate: l.workDate ?? "", person: l.person ?? "",
    cost: l.costPrice != null ? decimal(l.costPrice, digits) : "", markup: l.markupBps != null ? String(l.markupBps / 100) : "",
  };
}

/** A markup typed as a percent ("15", "12.5") in basis points, or null when blank or unreadable. */
export function markupBps(s: string | undefined): number | null {
  const t = (s ?? "").replace(/%/g, "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= 1000 ? Math.round(n * 100) : null;
}

export function qtyMilli(s: string) {
  const n = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : 0;
}

