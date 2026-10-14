import type { Exec } from "@billingease/db";
import { businesses } from "@billingease/db/schema";
import { eq, sql } from "drizzle-orm";

export type NumberKind = "invoice" | "quote" | "credit";

const COLUMN = { invoice: businesses.nextInvoiceNo, quote: businesses.nextQuoteNo, credit: businesses.nextCreditNo } as const;
const FIELD = { invoice: "nextInvoiceNo", quote: "nextQuoteNo", credit: "nextCreditNo" } as const;
const MIDDLE = { invoice: "", quote: "Q-", credit: "CN-" } as const;

/** HS-0050, HS-Q-0001, HS-CN-0001 (the business prefix, then a running number). */
export function formatNumber(prefix: string, kind: NumberKind, n: number): string {
  const p = MIDDLE[kind] && prefix && !/[-/]$/.test(prefix) ? prefix + "-" : prefix;
  return `${p}${MIDDLE[kind]}${String(n).padStart(4, "0")}`;
}

/**
 * Takes the next number for an invoice, quote or credit note. The counter is bumped with a
 * single UPDATE inside the caller's transaction, so two people issuing at once never get the
 * same number, and a rolled-back issue gives its number back.
 */
export async function nextNumber(db: Exec, businessId: string, kind: NumberKind): Promise<string> {
  const col = COLUMN[kind];
  const [row] = await db.update(businesses).set({ [FIELD[kind]]: sql`${col} + 1` })
    .where(eq(businesses.id, businessId))
    .returning({ n: col, prefix: businesses.invoicePrefix });
  return formatNumber(row.prefix, kind, row.n - 1);
}

/** The numbers the next invoice, quote and credit note will get (for previews only). */
export function upcomingNumbers(b: { invoicePrefix: string; nextInvoiceNo: number; nextQuoteNo: number; nextCreditNo: number }) {
  return {
    invoice: formatNumber(b.invoicePrefix, "invoice", b.nextInvoiceNo),
    quote: formatNumber(b.invoicePrefix, "quote", b.nextQuoteNo),
    creditNote: formatNumber(b.invoicePrefix, "credit", b.nextCreditNo),
  };
}
