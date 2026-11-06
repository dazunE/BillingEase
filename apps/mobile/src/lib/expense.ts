import type { ExpenseBody } from "@billingease/contracts";
import { currencyDigits, parseMoney } from "@billingease/core";

/** What the form holds: amounts as typed, so "12.5" stays "12.5" while editing. */
export type ExpenseDraft = { payee: string; gross: string; vat: string; spentOn: string; categoryId: string | null; method: string; bizPct: number };

const asText = (minor: number | null | undefined, digits: number) => (minor ? (minor / 10 ** digits).toFixed(digits) : "");

/** A draft from an agent's payload (an ExpenseBody it filled in), ready to edit. */
export function draftFrom(p: Partial<ExpenseBody> | Record<string, unknown>, currency: string, today: string): ExpenseDraft {
  const d = currencyDigits(currency);
  const x = p as Partial<ExpenseBody>;
  return {
    payee: String(x.payee ?? ""), gross: asText(x.gross as number, d), vat: asText(x.vat as number, d),
    spentOn: typeof x.spentOn === "string" ? x.spentOn : today, categoryId: (x.categoryId as string | null) ?? null,
    method: String(x.method ?? "Card"), bizPct: Number(x.bizPct ?? 100),
  };
}

/**
 * The body for POST /out/expenses (or an edited proposal payload), or null while it's incomplete.
 * VAT is only recorded separately by a VAT-registered business; anyone else records the full
 * amount, even when a receipt (or the agent that read it) shows VAT.
 */
export function bodyFrom(d: ExpenseDraft, currency: string, vatRegistered: boolean): ExpenseBody | null {
  const digits = currencyDigits(currency);
  const gross = parseMoney(d.gross, digits);
  const vat = vatRegistered && d.vat.trim() ? parseMoney(d.vat, digits) : 0;
  if (!gross || gross <= 0 || vat === null || vat < 0 || vat > gross || !d.payee.trim()) return null;
  return { spentOn: d.spentOn, payee: d.payee.trim(), categoryId: d.categoryId, gross, vat, method: d.method, bizPct: d.bizPct };
}
