import { comingIn } from "@billingease/contracts";
import { periodsFor, today, type PeriodKey } from "@billingease/core";
import { customers, invoices, items, quotes, recurringInvoices } from "@billingease/db/schema";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { route } from "../../lib/route";
import { invoiceRowsQuery, toRow } from "../../services/invoice-core";
import { upcomingNumbers } from "../../services/numbering";
import { comingIn as comingInTotals } from "../../services/summary";

export async function summaryRoutes(app: FastifyInstance) {
  route(app, comingIn.summary, async ({ query, ctx }) => {
    const b = ctx.business;
    const now = today();
    const all = periodsFor({ country: b.country, quarterType: b.quarterType }, now);
    const options: { key: PeriodKey; label: string }[] = b.country === "lk"
      ? [{ key: "month", label: "This month" }, { key: "year", label: "This year of assessment" }]
      : [{ key: "month", label: "This month" }, { key: "quarter", label: "This quarter" }, { key: "year", label: "This tax year" }];
    const key = options.some((o) => o.key === query.period) ? query.period! : all.default;
    const p = all[key];
    const label = key === "year" && b.country === "lk" ? p.label.replace("Tax year", "Year of assessment") : p.label;
    const totals = await comingInTotals(ctx.db, b.id, p.from, p.to, now);

    const open = await invoiceRowsQuery(ctx.db)
      .where(and(eq(invoices.businessId, b.id), eq(invoices.kind, "invoice"), inArray(invoices.status, ["sent", "part_paid"])))
      .orderBy(invoices.dueDate);
    const openRows = open.map((r) => toRow(r, now)).filter((r) => r.open > 0);
    const recent = await invoiceRowsQuery(ctx.db).where(and(eq(invoices.businessId, b.id), eq(invoices.kind, "invoice")))
      .orderBy(desc(invoices.updatedAt)).limit(6);
    const [drafts] = await ctx.db.select({ c: count() }).from(invoices).where(and(eq(invoices.businessId, b.id), eq(invoices.status, "draft")));
    const [waiting] = await ctx.db.select({ c: count() }).from(quotes).where(and(eq(quotes.businessId, b.id), eq(quotes.status, "sent")));
    const [rec] = await ctx.db.select({ c: count() }).from(recurringInvoices).where(and(eq(recurringInvoices.businessId, b.id), eq(recurringInvoices.active, true)));
    const [cust] = await ctx.db.select({ c: count() }).from(customers).where(and(eq(customers.businessId, b.id), isNull(customers.archivedAt)));
    const [its] = await ctx.db.select({ c: count() }).from(items).where(and(eq(items.businessId, b.id), isNull(items.archivedAt)));

    return {
      period: { key, from: p.from, to: p.to, label },
      periods: options,
      ...totals,
      lateInvoices: openRows.filter((r) => r.shown === "late"),
      onTheWayInvoices: openRows.filter((r) => r.shown !== "late" && r.issueDate >= p.from && r.issueDate <= p.to),
      recent: recent.map((r) => toRow(r, now)),
      counts: {
        unpaid: openRows.length, late: openRows.filter((r) => r.shown === "late").length, drafts: drafts.c,
        quotesWaiting: waiting.c, recurringActive: rec.c, customers: cust.c, items: its.c,
      },
      numbers: upcomingNumbers(b),
    };
  });
}


