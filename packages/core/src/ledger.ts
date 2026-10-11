import { rulesFor, type CountryCode } from "./countries";
import { sharePct } from "./money";

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export type AccountSeed = {
  code: string;
  name: string;
  type: AccountType;
  /** A stable role the app looks accounts up by. */
  role?: string;
  /** For category accounts: the country category id. */
  categoryId?: string;
  official?: string;
  allowable?: boolean;
  scope?: "business" | "property";
};

/** The chart of accounts a new business starts with, in its country's categories. */
export function chartOfAccounts(country: CountryCode): AccountSeed[] {
  const rules = rulesFor(country);
  const system: AccountSeed[] = [
    { code: "1000", name: "Bank account", type: "asset", role: "bank" },
    { code: "1010", name: "Cash", type: "asset", role: "cash" },
    { code: "1100", name: "Money customers owe you", type: "asset", role: "receivable" },
    { code: "1200", name: "VAT you can reclaim", type: "asset", role: "vat_input" },
    { code: "2000", name: "Bills you owe", type: "liability", role: "payable" },
    { code: "2050", name: "Business card", type: "liability", role: "card" },
    { code: "2200", name: "VAT you owe", type: "liability", role: "vat_output" },
    { code: "3000", name: "Money you put in", type: "equity", role: "owner_in" },
    { code: "3100", name: "Money you took out", type: "equity", role: "drawings" },
    { code: "3900", name: "Opening balances", type: "equity", role: "opening" },
    { code: "4000", name: "Sales", type: "income", role: "sales" },
    { code: "4100", name: "Other income", type: "income", role: "other_income" },
    { code: "4900", name: "Income to sort", type: "income", role: "uncategorised_in" },
    { code: "6990", name: "Spending to sort", type: "expense", role: "uncategorised_out" },
  ];
  if (rules.features.sscl) system.push({ code: "2210", name: "SSCL you owe", type: "liability", role: "sscl" });
  if (rules.features.landlord) system.push({ code: "4500", name: "Rent from property", type: "income", role: "rent" });
  const cats: AccountSeed[] = rules.categories.map((c) => ({
    code: c.accountCode, name: c.name, type: "expense", categoryId: c.id, official: c.official, allowable: c.allowable, scope: c.scope,
  }));
  return [...system, ...cats].sort((a, b) => a.code.localeCompare(b.code));
}

/** A line of a journal entry, by account code. Amounts in minor units. */
export type PostingLine = { code: string; debit?: number; credit?: number };

export class LedgerError extends Error {}

/** Drops zero lines and checks the entry balances. Every money movement goes through this. */
export function balanced(lines: PostingLine[]): { code: string; debit: number; credit: number }[] {
  const out = lines
    .map((l) => ({ code: l.code, debit: Math.round(l.debit ?? 0), credit: Math.round(l.credit ?? 0) }))
    .filter((l) => l.debit !== 0 || l.credit !== 0);
  for (const l of out) {
    if (l.debit < 0 || l.credit < 0) throw new LedgerError("Debits and credits must be positive.");
    if (l.debit > 0 && l.credit > 0) throw new LedgerError("A line is a debit or a credit, not both.");
  }
  if (out.length < 2) throw new LedgerError("An entry needs at least two lines.");
  const d = out.reduce((a, l) => a + l.debit, 0);
  const c = out.reduce((a, l) => a + l.credit, 0);
  if (d !== c) throw new LedgerError(`Unbalanced entry: debits ${d}, credits ${c}.`);
  return out;
}

/** Which account a payment method moves money in or out of. */
export function moneyAccountFor(method: string): string {
  const m = method.toLowerCase();
  if (m === "cash") return "1010";
  if (m === "card") return "2050";
  return "1000";
}

export const posting = {
  /** An invoice is sent: the customer owes the total. */
  invoice(t: { net: number; vat: number; sscl: number; total: number }, incomeCode = "4000"): PostingLine[] {
    return [
      { code: "1100", debit: t.total },
      { code: incomeCode, credit: t.net },
      { code: "2200", credit: t.vat },
      { code: "2210", credit: t.sscl },
    ];
  },
  /** A credit note reduces what the customer owes, and the sale and tax with it. */
  creditNote(t: { net: number; vat: number; sscl: number; total: number }, incomeCode = "4000"): PostingLine[] {
    return [
      { code: incomeCode, debit: t.net },
      { code: "2200", debit: t.vat },
      { code: "2210", debit: t.sscl },
      { code: "1100", credit: t.total },
    ];
  },
  /** Money received against an invoice. */
  receipt(amount: number, method: string): PostingLine[] {
    return [{ code: moneyAccountFor(method), debit: amount }, { code: "1100", credit: amount }];
  },
  /**
   * An expense paid there and then. Only the business share is a cost (and only its VAT is
   * reclaimable); the rest is money you took out.
   */
  expense(x: { gross: number; vat: number; bizPct: number; categoryCode: string; method: string; vatRegistered: boolean }): PostingLine[] {
    const vat = x.vatRegistered ? x.vat : 0;
    const net = x.gross - vat;
    const bizNet = sharePct(net, x.bizPct);
    const bizVat = sharePct(vat, x.bizPct);
    const personal = x.gross - bizNet - bizVat;
    return [
      { code: x.categoryCode, debit: bizNet },
      { code: "1200", debit: bizVat },
      { code: "3100", debit: personal },
      { code: moneyAccountFor(x.method), credit: x.gross },
    ];
  },
  /** A bill arrives: you owe the supplier. */
  bill(lines: { categoryCode: string; net: number; vat: number }[], vatRegistered: boolean): PostingLine[] {
    const total = lines.reduce((a, l) => a + l.net + l.vat, 0);
    const out: PostingLine[] = [];
    for (const l of lines) out.push({ code: l.categoryCode, debit: l.net + (vatRegistered ? 0 : l.vat) });
    if (vatRegistered) out.push({ code: "1200", debit: lines.reduce((a, l) => a + l.vat, 0) });
    out.push({ code: "2000", credit: total });
    return out;
  },
  /** Paying a bill, in full or in part. */
  billPayment(amount: number, method: string): PostingLine[] {
    return [{ code: "2000", debit: amount }, { code: moneyAccountFor(method), credit: amount }];
  },
};
