import { addDays, formatDate, formatMoney, rulesFor, type CountryCode, type Currency } from "@billingease/core";
import type { ProposalKind } from "@billingease/contracts";

/**
 * Matches statement lines to what's already in the books, and decides what to propose for
 * the rest. Pure: the caller loads the books and writes the outcome.
 */

export type Line = { seq: number; date: string; description: string; amount: number; reference: string | null };

export type Books = {
  country: CountryCode;
  currency: Currency;
  vatRegistered: boolean;
  /** Invoices still owed: sent or part paid, open = total − paid − credited. */
  invoices: { id: string; number: string; customer: string; open: number }[];
  /** Bills still to pay. */
  bills: { id: string; supplier: string; reference: string | null; open: number }[];
  /** Already recorded around the statement's dates, so they aren't proposed twice. */
  receipts: { id: string; invoiceId: string; amount: number; date: string }[];
  billPayments: { id: string; billId: string; amount: number; date: string }[];
  expenses: { id: string; payee: string; gross: number; date: string }[];
  /** For categories: saved suppliers and what earlier expenses to a payee were. */
  suppliers: { id: string; name: string; categoryId: string | null }[];
  payeeCategories: { payee: string; categoryId: string }[];
};

export type Decision =
  | { seq: number; action: "matched"; table: "receipts" | "bill_payments" | "expenses"; id: string; note: string }
  | { seq: number; action: "propose"; kind: ProposalKind; targetId: string | null; payload: Record<string, unknown>; title: string; summary: string; confidence: number; categoryId?: string | null }
  | { seq: number; action: "classify" }
  | { seq: number; action: "unmatched"; note: string };

/** Lower case without accents: banks print "OCHRE CAFE" for "Ochre Café". */
const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const words = (s: string) => plain(s).replace(/[^a-z0-9]+/g, " ").trim();
const compact = (s: string) => plain(s).replace(/[^a-z0-9]/g, "");
/** "Kandyan Spice Co" is in "CEFT TRF FROM KANDYAN SPICE CO LTD": all its words of 3+ letters are. */
export function mentions(description: string, name: string) {
  const d = ` ${words(description)} `;
  const ws = words(name).split(" ").filter((w) => w.length >= 3 && !["ltd", "limited", "plc", "pvt", "the", "and", "co"].includes(w));
  return ws.length > 0 && ws.every((w) => d.includes(` ${w} `));
}
const near = (a: string, b: string, days = 5) => a >= addDays(b, -days) && a <= addDays(b, days);

/** How the money moved, from the bank's words. */
export function methodFor(country: CountryCode, description: string, amount: number): string {
  const d = description.toUpperCase();
  const methods = rulesFor(country).payMethods;
  const pick = (m: string) => (methods.includes(m) ? m : methods[0]);
  if (/\b(CHQ|CHEQUE|CHECK)\b/.test(d)) return pick("Cheque");
  if (/\b(DD|DIRECT DEBIT)\b/.test(d) && amount < 0) return pick("Direct debit");
  if (/\b(CARD|POS|VISA|MASTERCARD|CONTACTLESS|DEB)\b/.test(d)) return pick("Card");
  if (/\b(CASH|ATM)\b/.test(d)) return pick("Cash");
  return pick("Bank transfer");
}

/** A payee name for an expense from the bank's words: card and transfer noise removed. */
export function payeeFrom(description: string) {
  const cleaned = description
    .replace(/\b(CARD PAYMENT TO|CARD PURCHASE|POS|VISA|CONTACTLESS|DIRECT DEBIT|DD|FASTER PAYMENT|FPO|FPI|BGC|DEB|SO|STO|TFR|TRF|CEFT|SLIPS|ONLINE|PAYMENT TO|BILL PAYMENT|PAYMENT|TO)\b/gi, " ")
    .replace(/\b\d{2}[A-Z]{3}\d{0,2}\b|\b\d{4,}\b|\*+\d+/gi, " ")
    .replace(/[^A-Za-z0-9&'.\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const name = cleaned || description.trim();
  return name.length > 60 ? name.slice(0, 60) : name;
}

export function matchLines(lines: Line[], b: Books): Decision[] {
  const money = (m: number) => formatMoney(Math.abs(m), b.currency);
  const used = new Set<string>();
  const take = <T extends { id: string }>(xs: T[], ok: (x: T) => boolean) => {
    const x = xs.find((y) => !used.has(y.id) && ok(y));
    if (x) used.add(x.id);
    return x;
  };
  const out: Decision[] = [];
  for (const l of lines) {
    const amt = Math.abs(l.amount);
    const when = formatDate(l.date, { year: true });
    const ref = (l.reference ?? l.description).slice(0, 120);
    if (l.amount > 0) {
      const r = take(b.receipts, (x) => x.amount === amt && near(x.date, l.date));
      if (r) { out.push({ seq: l.seq, action: "matched", table: "receipts", id: r.id, note: "Already recorded as a payment" }); continue; }
      const byNumber = b.invoices.filter((i) => !used.has(i.id) && i.number && compact(l.description + " " + (l.reference ?? "")).includes(compact(i.number)));
      const byAmount = b.invoices.filter((i) => !used.has(i.id) && i.open === amt);
      let inv = byNumber.length === 1 ? byNumber[0] : undefined;
      let confidence = 0;
      if (inv) confidence = inv.open === amt ? 96 : 78;
      else {
        const named = byAmount.filter((i) => mentions(l.description, i.customer));
        if (named.length === 1) { inv = named[0]; confidence = 88; }
        else if (byAmount.length === 1) { inv = byAmount[0]; confidence = 68; }
      }
      if (inv && amt <= inv.open) {
        used.add(inv.id);
        const part = amt < inv.open;
        out.push({
          seq: l.seq, action: "propose", kind: "receipt.create", targetId: inv.id, confidence,
          payload: { amount: amt, receivedOn: l.date, method: methodFor(b.country, l.description, l.amount), reference: ref },
          title: `${inv.customer} paid ${money(amt)} on ${inv.number}`,
          summary: `Money in on ${when}: “${l.description}”. ${part ? `Part of the ${money(inv.open)} still owed on ${inv.number}.` : `${inv.number} is owed exactly that.`}${confidence < 80 ? " Matched by the amount only: check it's the right invoice." : ""}`,
        });
        continue;
      }
      out.push({ seq: l.seq, action: "unmatched", note: byAmount.length > 1 ? `Money in that matches ${byAmount.length} invoices: record it on the right one by hand.` : "Money in that doesn't match an invoice still owed." });
      continue;
    }
    const e = take(b.expenses, (x) => x.gross === amt && near(x.date, l.date));
    if (e) { out.push({ seq: l.seq, action: "matched", table: "expenses", id: e.id, note: `Already recorded: ${e.payee}` }); continue; }
    const bp = take(b.billPayments, (x) => x.amount === amt && near(x.date, l.date));
    if (bp) { out.push({ seq: l.seq, action: "matched", table: "bill_payments", id: bp.id, note: "Already recorded as a bill payment" }); continue; }
    const named = b.bills.filter((x) => !used.has(x.id) && x.open >= amt && (mentions(l.description, x.supplier) || (x.reference && compact(l.description).includes(compact(x.reference)))));
    const exact = b.bills.filter((x) => !used.has(x.id) && x.open === amt);
    const bill = named.length === 1 ? named[0] : exact.length === 1 && mentions(l.description, exact[0].supplier) ? exact[0] : undefined;
    if (bill) {
      used.add(bill.id);
      out.push({
        seq: l.seq, action: "propose", kind: "bill_payment.create", targetId: bill.id, confidence: bill.open === amt ? 92 : 75,
        payload: { amount: amt, paidOn: l.date, method: methodFor(b.country, l.description, l.amount), reference: ref },
        title: `Paid ${bill.supplier} ${money(amt)}`,
        summary: `Money out on ${when}: “${l.description}”. ${bill.open === amt ? "Pays the bill in full." : `Part of the ${money(bill.open)} still to pay.`}`,
      });
      continue;
    }
    out.push({ seq: l.seq, action: "classify" });
  }
  return out;
}

/** What the classifier (rules, then the model) said about a money-out line. */
export type Classified = { seq: number; kind: "business_cost" | "transfer" | "personal" | "tax" | "loan" | "other"; payee: string; categoryId: string | null; confidence: number; supplierId?: string | null };

/** Categories from what the business already knows: its suppliers, and earlier expenses. */
export function classifyByRules(lines: Line[], b: Books): { known: Classified[]; rest: Line[] } {
  const known: Classified[] = [];
  const rest: Line[] = [];
  for (const l of lines) {
    const sup = b.suppliers.find((s) => mentions(l.description, s.name));
    if (sup) { known.push({ seq: l.seq, kind: "business_cost", payee: sup.name, categoryId: sup.categoryId, confidence: sup.categoryId ? 88 : 70, supplierId: sup.id }); continue; }
    const prev = b.payeeCategories.find((p) => mentions(l.description, p.payee));
    if (prev) { known.push({ seq: l.seq, kind: "business_cost", payee: prev.payee, categoryId: prev.categoryId, confidence: 82 }); continue; }
    rest.push(l);
  }
  return { known, rest };
}

const NOT_COSTS: Record<Exclude<Classified["kind"], "business_cost">, string> = {
  transfer: "Looks like a move between your own accounts: not a cost.",
  personal: "Looks personal: not a business cost.",
  tax: "Looks like a tax payment: not a business cost.",
  loan: "Looks like a loan repayment: only the interest is a cost. Add that by hand.",
  other: "Couldn't tell what this was. Add it by hand if it's a business cost.",
};

/** Turns a classified money-out line into an expense proposal, or a reason to leave it. */
export function expenseFor(l: Line, c: Classified, b: Books): Decision {
  if (c.kind !== "business_cost") return { seq: l.seq, action: "unmatched", note: NOT_COSTS[c.kind] };
  const rules = rulesFor(b.country);
  const category = c.categoryId && rules.categories.some((x) => x.id === c.categoryId) ? c.categoryId : null;
  const amt = Math.abs(l.amount);
  const payee = (c.payee || payeeFrom(l.description)).slice(0, 160);
  const notes = [
    category ? null : "No category picked: it will go to Spending to sort.",
    b.vatRegistered ? `A bank statement doesn't show VAT: add it if you have the ${b.country === "uk" ? "VAT receipt" : "Tax Invoice"}.` : null,
  ].filter(Boolean);
  return {
    seq: l.seq, action: "propose", kind: "expense.create", targetId: null, categoryId: category,
    confidence: Math.max(0, Math.min(100, Math.round(c.confidence) - (category ? 0 : 15))),
    payload: {
      spentOn: l.date, ...(c.supplierId ? { supplierId: c.supplierId } : {}), payee, categoryId: category, gross: amt, vat: 0,
      method: methodFor(b.country, l.description, l.amount), note: `From your bank statement: ${l.description}`.slice(0, 1000),
    },
    title: `${payee}, ${formatMoney(amt, b.currency)}`,
    summary: `Money out on ${formatDate(l.date, { year: true })}: “${l.description}”.${category ? ` ${rules.categories.find((x) => x.id === category)!.name}.` : ""} ${notes.join(" ")}`.trim(),
  };
}
