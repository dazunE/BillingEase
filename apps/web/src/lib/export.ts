import "server-only";
import { comingIn, goingOut } from "@billingease/contracts";
import { currencyDigits, minorToDecimal, toCsv, type Cell } from "@billingease/core";
import { call } from "./api";

/** What Security and data → Take your data out offers. */
export const EXPORTS = ["invoices", "expenses", "bills", "customers"] as const;
export type ExportKind = (typeof EXPORTS)[number];

const dec = (minor: number, currency: string) => minorToDecimal(minor, currencyDigits(currency));

/** One file built from the books as they are now. */
export async function buildExport(kind: ExportKind, home: string): Promise<{ csv: string; rows: number }> {
  if (kind === "invoices") {
    const [inv, cn] = await Promise.all([
      call(comingIn.listInvoices, { query: { status: "all", kind: "invoice" } }),
      call(comingIn.listInvoices, { query: { status: "all", kind: "credit_note" } }),
    ]);
    const all = [...inv.invoices, ...cn.invoices];
    const rows: Cell[][] = all.map((i) => [
      i.kind === "credit_note" ? "Credit note" : "Invoice", i.number ?? "Draft", i.status, i.customerName, i.issueDate, i.dueDate, i.summary, i.currency,
      dec(i.net, i.currency), dec(i.vat, i.currency), dec(i.sscl, i.currency), dec(i.total, i.currency), dec(i.paid, i.currency), i.fxRate,
    ]);
    return { csv: toCsv(["Type", "Number", "Status", "Customer", "Issued", "Due", "What for", "Currency", "Net", "VAT", "SSCL", "Total", "Paid", `Rate to ${home}`], rows), rows: rows.length };
  }
  if (kind === "expenses") {
    // The list answers 500 at a time, newest first: step back by date until it runs out.
    const seen = new Map<string, Awaited<ReturnType<typeof call<typeof goingOut.expenses>>>["expenses"][number]>();
    let to: string | undefined;
    for (let page = 0; page < 200; page++) {
      const r = await call(goingOut.expenses, { query: { limit: 500, to } });
      for (const x of r.expenses) seen.set(x.id, x);
      if (r.expenses.length < 500) break;
      const oldest = r.expenses[r.expenses.length - 1].spentOn;
      if (oldest === r.expenses[0].spentOn || oldest === to) break;
      to = oldest;
    }
    const rows: Cell[][] = [...seen.values()].map((x) => [
      x.spentOn, x.payee, x.categoryName ?? "Needs a category", x.categoryOfficial, dec(x.gross, home), dec(x.vat, home), x.bizPct, dec(x.businessShare, home), x.method,
      x.currency, x.originalGross === null || !x.currency ? null : dec(x.originalGross, x.currency), x.note,
    ]);
    return { csv: toCsv(["Date", "Paid to", "Category", "Official name", `Amount (${home})`, `VAT (${home})`, "Business %", `Business share (${home})`, "How paid", "Receipt currency", "Receipt amount", "Note"], rows), rows: rows.length };
  }
  if (kind === "bills") {
    const r = await call(goingOut.bills, { query: { status: "all" } });
    const rows: Cell[][] = r.bills.map((b) => [
      b.supplierName, b.reference, b.description, b.billDate, b.dueDate, b.status, b.currency, dec(b.net, b.currency), dec(b.vat, b.currency), dec(b.total, b.currency), dec(b.paid, b.currency), dec(b.left, b.currency),
    ]);
    return { csv: toCsv(["Supplier", "Reference", "What for", "Dated", "Due", "Status", "Currency", "Net", "VAT", "Total", "Paid", "Left to pay"], rows), rows: rows.length };
  }
  const r = await call(comingIn.listCustomers, { query: { archived: "all" } });
  const rows: Cell[][] = r.customers.map((c) => [c.name, c.contactName, c.email, c.phone, c.address, c.taxId, c.vatNumber, c.currency ?? home, c.archived ? "Yes" : "No", c.notes]);
  return { csv: toCsv(["Name", "Contact", "Email", "Phone", "Address", "Tax ID", "VAT number", "Currency", "Archived", "Notes"], rows), rows: rows.length };
}

/** A file name like harper-studio-invoices-2026-10-11.csv. */
export function exportName(business: string, kind: ExportKind, today: string) {
  const slug = business.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40) || "business";
  return `${slug}-${kind}-${today}.csv`;
}
