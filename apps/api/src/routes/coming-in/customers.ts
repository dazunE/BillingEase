import { comingIn, type Customer } from "@billingease/contracts";
import { rulesFor, today } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { customers, invoiceLines, invoices, items, quotes, receipts, recurringInvoices } from "@billingease/db/schema";
import { and, asc, between, count, desc, eq, ilike, inArray, isNotNull, isNull, ne, notInArray, or, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../../lib/activity";
import type { BusinessRow } from "../../lib/context";
import { badRequest, notFound } from "../../lib/errors";
import { route } from "../../lib/route";
import { idOr404, invoiceRowsQuery, toRow } from "../../services/invoice-core";
import { quoteRowsQuery, toQuoteRow } from "../../services/quote-core";
import { recurringOut } from "../../services/recurring-run";

const n = (v: unknown) => Number(v ?? 0);
const customerLink = (id: string) => `/app/in/customers/${id}`;

/** Customers with what they owe, what's late and what they've paid. */
export async function customerRows(db: Exec, b: BusinessRow, where: ReturnType<typeof and>): Promise<Customer[]> {
  const now = today();
  const open = sql`${invoices.total} - ${invoices.paid} - ${invoices.credited}`;
  const agg = db.select({
    customerId: invoices.customerId,
    owed: sql<string>`coalesce(sum(${open}), 0)`.as("owed"),
    late: sql<string>`coalesce(sum(case when ${invoices.dueDate} < ${now} then ${open} else 0 end), 0)`.as("late"),
    paid: sql<string>`coalesce(sum(${invoices.paid}), 0)`.as("paid"),
    openCount: sql<string>`count(*) filter (where ${open} > 0)`.as("open_count"),
  }).from(invoices)
    .where(and(eq(invoices.businessId, b.id), eq(invoices.kind, "invoice"), notInArray(invoices.status, ["draft", "void"])))
    .groupBy(invoices.customerId).as("agg");
  const rows = await db.select({ c: customers, owed: agg.owed, late: agg.late, paid: agg.paid, openCount: agg.openCount })
    .from(customers).leftJoin(agg, eq(agg.customerId, customers.id))
    .where(and(eq(customers.businessId, b.id), where))
    .orderBy(asc(sql`lower(${customers.name})`));
  return rows.map((r) => ({
    id: r.c.id, name: r.c.name, contactName: r.c.contactName, email: r.c.email, phone: r.c.phone, address: r.c.address,
    taxId: r.c.taxId, vatNumber: r.c.vatNumber, notes: r.c.notes, archived: !!r.c.archivedAt, createdAt: r.c.createdAt.toISOString(),
    owed: n(r.owed), late: n(r.late), paid: n(r.paid), openCount: n(r.openCount),
  }));
}

async function oneCustomer(db: Exec, b: BusinessRow, id: string) {
  const [c] = await customerRows(db, b, eq(customers.id, idOr404(id, "That customer")));
  if (!c) throw notFound("That customer");
  return c;
}

function cleanBody<T extends { taxId: string | null; vatNumber: string | null }>(b: BusinessRow, body: T): T {
  // A TIN is printed on Sri Lankan Tax Invoices; UK invoices only carry a VAT number.
  return { ...body, taxId: b.country === "lk" ? body.taxId : null };
}

export async function customerRoutes(app: FastifyInstance) {
  route(app, comingIn.listCustomers, async ({ query, ctx }) => {
    const like = query.q ? `%${query.q.replace(/[%_]/g, "")}%` : null;
    const where = and(
      query.archived === "true" ? isNotNull(customers.archivedAt) : query.archived === "all" ? undefined : isNull(customers.archivedAt),
      like ? or(ilike(customers.name, like), ilike(customers.email, like), ilike(customers.contactName, like)) : undefined,
    );
    return { customers: await customerRows(ctx.db, ctx.business, where) };
  });

  route(app, comingIn.getCustomer, async ({ params, ctx }) => {
    const b = ctx.business;
    const customer = await oneCustomer(ctx.db, b, params.id);
    const year = rulesFor(b.country).taxYearOf(today());
    const [paid] = await ctx.db.select({ sum: sql<string>`coalesce(sum(${receipts.amount}), 0)` }).from(receipts)
      .innerJoin(invoices, eq(invoices.id, receipts.invoiceId))
      .where(and(eq(receipts.businessId, b.id), eq(invoices.customerId, customer.id), isNull(receipts.voidedAt), between(receipts.receivedOn, year.from, year.to)));
    const invs = await invoiceRowsQuery(ctx.db).where(and(eq(invoices.businessId, b.id), eq(invoices.customerId, customer.id))).orderBy(desc(invoices.issueDate), desc(invoices.createdAt));
    const qs = await quoteRowsQuery(ctx.db).where(and(eq(quotes.businessId, b.id), eq(quotes.customerId, customer.id))).orderBy(desc(quotes.issueDate), desc(quotes.createdAt));
    const recs = await ctx.db.select().from(recurringInvoices).where(and(eq(recurringInvoices.businessId, b.id), eq(recurringInvoices.customerId, customer.id)));
    const counts = recs.length
      ? await ctx.db.select({ id: invoices.recurringId, c: count() }).from(invoices).where(and(eq(invoices.businessId, b.id), inArray(invoices.recurringId, recs.map((r) => r.id)), ne(invoices.status, "draft"))).groupBy(invoices.recurringId)
      : [];
    const rows = invs.map((r) => toRow(r));
    return {
      customer,
      paidThisYear: n(paid.sum),
      yearLabel: year.label,
      invoices: rows.filter((r) => r.kind === "invoice"),
      creditNotes: rows.filter((r) => r.kind === "credit_note"),
      quotes: qs.map(toQuoteRow),
      recurring: recs.map((r) => recurringOut(b, r, customer.name, counts.find((x) => x.id === r.id)?.c ?? 0)),
    };
  });

  route(app, comingIn.createCustomer, async ({ body, ctx }) => {
    const b = ctx.business;
    const [row] = await ctx.db.insert(customers).values({ ...cleanBody(b, body), businessId: b.id }).returning({ id: customers.id });
    await logActivity(ctx.db, b.id, `Customer ${body.name} added`, { actorId: ctx.user.id, link: customerLink(row.id) });
    return oneCustomer(ctx.db, b, row.id);
  });

  route(app, comingIn.updateCustomer, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const [row] = await ctx.db.update(customers).set(cleanBody(b, body))
      .where(and(eq(customers.id, idOr404(params.id, "That customer")), eq(customers.businessId, b.id))).returning({ id: customers.id });
    if (!row) throw notFound("That customer");
    await logActivity(ctx.db, b.id, `${body.name}'s details updated`, { actorId: ctx.user.id, link: customerLink(row.id) });
    return oneCustomer(ctx.db, b, row.id);
  });

  route(app, comingIn.archiveCustomer, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const [row] = await ctx.db.update(customers).set({ archivedAt: body.archived ? new Date() : null })
      .where(and(eq(customers.id, idOr404(params.id, "That customer")), eq(customers.businessId, b.id))).returning({ id: customers.id, name: customers.name });
    if (!row) throw notFound("That customer");
    await logActivity(ctx.db, b.id, body.archived ? `Customer ${row.name} archived` : `Customer ${row.name} brought back`, { actorId: ctx.user.id, link: customerLink(row.id) });
    return oneCustomer(ctx.db, b, row.id);
  });

  // ---------------------------------------------------------------------------
  // Price list

  const itemOut = async (db: Exec, b: BusinessRow, id: string) => {
    const [r] = await itemRows(db, b, eq(items.id, idOr404(id, "That price")));
    if (!r) throw notFound("That price");
    return r;
  };
  const checkItem = (b: BusinessRow, body: { vatRateId: string | null; sscl: boolean }) => {
    const rules = rulesFor(b.country);
    if (body.vatRateId && !rules.vatRates.some((r) => r.id === body.vatRateId)) throw badRequest("Pick one of the VAT rates.", { vatRateId: "Pick a VAT rate" });
    return { vatRateId: body.vatRateId, sscl: rules.features.sscl ? body.sscl : false };
  };

  route(app, comingIn.listItems, async ({ query, ctx }) => {
    const like = query.q ? `%${query.q.replace(/[%_]/g, "")}%` : null;
    return {
      items: await itemRows(ctx.db, ctx.business, and(
        query.archived === "true" ? isNotNull(items.archivedAt) : query.archived === "all" ? undefined : isNull(items.archivedAt),
        like ? or(ilike(items.name, like), ilike(items.description, like)) : undefined,
      )),
    };
  });

  route(app, comingIn.createItem, async ({ body, ctx }) => {
    const b = ctx.business;
    const [row] = await ctx.db.insert(items).values({ ...body, ...checkItem(b, body), businessId: b.id }).returning({ id: items.id });
    await logActivity(ctx.db, b.id, `${body.name} added to your price list`, { actorId: ctx.user.id, link: "/app/in/prices" });
    return itemOut(ctx.db, b, row.id);
  });

  route(app, comingIn.updateItem, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const [row] = await ctx.db.update(items).set({ ...body, ...checkItem(b, body) })
      .where(and(eq(items.id, idOr404(params.id, "That price")), eq(items.businessId, b.id))).returning({ id: items.id });
    if (!row) throw notFound("That price");
    return itemOut(ctx.db, b, row.id);
  });

  route(app, comingIn.archiveItem, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const [row] = await ctx.db.update(items).set({ archivedAt: body.archived ? new Date() : null })
      .where(and(eq(items.id, idOr404(params.id, "That price")), eq(items.businessId, b.id))).returning({ id: items.id, name: items.name });
    if (!row) throw notFound("That price");
    await logActivity(ctx.db, b.id, body.archived ? `${row.name} removed from your price list` : `${row.name} back on your price list`, { actorId: ctx.user.id, link: "/app/in/prices" });
    return itemOut(ctx.db, b, row.id);
  });
}

async function itemRows(db: Exec, b: BusinessRow, where: ReturnType<typeof and>) {
  const used = sql<string>`(select count(distinct ${invoiceLines.invoiceId}) from ${invoiceLines} where ${invoiceLines.itemId} = ${items.id})`;
  const rows = await db.select({ i: items, used }).from(items).where(and(eq(items.businessId, b.id), where)).orderBy(asc(sql`lower(${items.name})`));
  return rows.map(({ i, used }) => ({
    id: i.id, name: i.name, description: i.description, unit: i.unit, unitPrice: i.unitPrice, vatRateId: i.vatRateId, sscl: i.sscl, archived: !!i.archivedAt, usedCount: n(used),
  }));
}
