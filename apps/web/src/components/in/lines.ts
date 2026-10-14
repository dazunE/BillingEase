import type { Item } from "@billingease/contracts";

/** Editor lines as typed (strings), and how they are made. Shared by server pages and the editor. */
export type LineState = { key: string; itemId: string | null; description: string; qty: string; price: string; discount: string; vatRateId: string | null; sscl: boolean };

let k = 0;
const key = () => `l${Date.now().toString(36)}${k++}`;
const decimal = (minor: number) => (minor / 100).toFixed(2);

export function lineFromItem(i: Item): LineState {
  return { key: key(), itemId: i.id, description: i.name, qty: "1", price: decimal(i.unitPrice), discount: "", vatRateId: i.vatRateId, sscl: i.sscl };
}
export function blankLine(defaultVat: string | null): LineState {
  return { key: key(), itemId: null, description: "", qty: "1", price: "", discount: "", vatRateId: defaultVat, sscl: true };
}
export function lineFromStored(l: { itemId?: string | null; description: string; quantityMilli: number; unitPrice: number; discount?: number; vatRateId?: string | null; sscl?: boolean }): LineState {
  return { key: key(), itemId: l.itemId ?? null, description: l.description, qty: String(l.quantityMilli / 1000), price: decimal(l.unitPrice), discount: l.discount ? decimal(l.discount) : "", vatRateId: l.vatRateId ?? null, sscl: l.sscl !== false };
}

export function qtyMilli(s: string) {
  const n = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : 0;
}

