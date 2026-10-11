import { comingIn, type RecurringBody } from "@billingease/contracts";
import { today } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { customers, invoices, recurringInvoices } from "@billingease/db/schema";
import { and, count, desc, eq, inArray, ne } from "drizzle-orm";
import type { z } from "zod";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../../lib/activity";
import type { BusinessRow } from "../../lib/context";
import { badRequest, conflict, notFound } from "../../lib/errors";
import { route } from "../../lib/route";
import { checkRefs, computeLines, idOr404, invoiceRowsQuery, normalLines, toRow } from "../../services/invoice-core";
import { recurringOut, runOnce } from "../../services/recurring-run";

const link = (id: string) => `/app/in/repeating/${id}`;

async function rowsFor(db: Exec, b: BusinessRow, ids?: string[]) {
  const rows = await db.select({ r: recurringInvoices, customerName: customers.name }).from(recurringInvoices)
    .innerJoin(customers, eq(customers.id, recurringInvoices.customerId))
    .where(and(eq(recurringInvoices.businessId, b.id), ids ? inArray(recurringInvoices.id, ids) : undefined))
    .orderBy(desc(recurringInvoices.active), recurringInvoices.nextRun);
  const counts = rows.length
    ? await db.select({ id: invoices.recurringId, c: count() }).from(invoices)
      .where(and(eq(invoices.businessId, b.id), inArray(invoices.recurringId, rows.map((r) => r.r.id)), ne(invoices.status, "draft"))).groupBy(invoices.recurringId)
    : [];
  return rows.map(({ r, customerName }) => recurringOut(b, r, customerName, counts.find((x) => x.id === r.id)?.c ?? 0));
}

async function one(db: Exec, b: BusinessRow, id: string) {
  const [r] = await rowsFor(db, b, [idOr404(id, "That repeating invoice")]);
  if (!r) throw notFound("That repeating invoice");
  return r;
}

async function values(db: Exec, b: BusinessRow, body: z.output<typeof RecurringBody>, previousNextRun?: string) {
  const lines = normalLines(body.lines, b);
  await checkRefs(db, b, body.customerId, lines);
  computeLines(b, lines); // checks the VAT rates and discounts
  if (body.nextRun < today() && body.nextRun !== previousNextRun) throw badRequest("Pick today or a later date for the next invoice.", { nextRun: "Today or later" });
  if (body.endDate && body.endDate < body.nextRun) throw badRequest("The end date is before the next invoice.", { endDate: "After the next invoice" });
  return {
    customerId: body.customerId, name: body.name, frequency: body.frequency, nextRun: body.nextRun, endDate: body.endDate ?? null, mode: body.mode,
    template: { lines, notes: body.notes ?? null, reference: body.reference ?? null, termsDays: body.termsDays },
  };
}

export async function recurringRoutes(app: FastifyInstance) {
  route(app, comingIn.listRecurring, async ({ ctx }) => {
    const list = await rowsFor(ctx.db, ctx.business);
    const perMonth = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 } as const;
    const monthly = Math.round(list.filter((r) => r.active).reduce((a, r) => a + r.total * perMonth[r.frequency], 0));
    return { recurring: list, monthly };
  });

  route(app, comingIn.getRecurring, async ({ params, ctx }) => {
    const r = await one(ctx.db, ctx.business, params.id);
    const invs = await invoiceRowsQuery(ctx.db).where(and(eq(invoices.businessId, ctx.business.id), eq(invoices.recurringId, r.id))).orderBy(desc(invoices.issueDate), desc(invoices.createdAt));
    return { ...r, invoices: invs.map((x) => toRow(x)) };
  });

  route(app, comingIn.createRecurring, async ({ body, ctx }) => {
    const b = ctx.business;
    const v = await values(ctx.db, b, body);
    const [row] = await ctx.db.insert(recurringInvoices).values({ ...v, businessId: b.id }).returning({ id: recurringInvoices.id });
    await logActivity(ctx.db, b.id, `Repeating invoice "${body.name}" set up`, { actorId: ctx.user.id, link: link(row.id) });
    return one(ctx.db, b, row.id);
  });

  route(app, comingIn.updateRecurring, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const [cur] = await ctx.db.select().from(recurringInvoices).where(and(eq(recurringInvoices.id, idOr404(params.id, "That repeating invoice")), eq(recurringInvoices.businessId, b.id)));
    if (!cur) throw notFound("That repeating invoice");
    const v = await values(ctx.db, b, body, cur.nextRun);
    await ctx.db.update(recurringInvoices).set(v).where(and(eq(recurringInvoices.id, cur.id), eq(recurringInvoices.businessId, b.id)));
    await logActivity(ctx.db, b.id, `Repeating invoice "${body.name}" changed`, { actorId: ctx.user.id, link: link(cur.id) });
    return one(ctx.db, b, cur.id);
  });

  route(app, comingIn.pauseRecurring, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const [cur] = await ctx.db.select().from(recurringInvoices).where(and(eq(recurringInvoices.id, idOr404(params.id, "That repeating invoice")), eq(recurringInvoices.businessId, b.id)));
    if (!cur) throw notFound("That repeating invoice");
    // Resuming after a long pause starts again from today, rather than catching up every missed run.
    let nextRun = cur.nextRun;
    if (body.active) {
      const now = today();
      if (cur.endDate && cur.endDate < now) throw conflict("This repeating invoice has ended. Change the end date to start it again.");
      if (nextRun < now) nextRun = now;
    }
    await ctx.db.update(recurringInvoices).set({ active: body.active, nextRun }).where(eq(recurringInvoices.id, cur.id));
    await logActivity(ctx.db, b.id, `Repeating invoice "${cur.name}" ${body.active ? "resumed" : "paused"}`, { actorId: ctx.user.id, link: link(cur.id) });
    return one(ctx.db, b, cur.id);
  });

  route(app, comingIn.runRecurring, async ({ params, ctx }) => {
    const b = ctx.business;
    const res = await ctx.db.transaction(async (tx) => {
      const [cur] = await tx.select().from(recurringInvoices).where(and(eq(recurringInvoices.id, idOr404(params.id, "That repeating invoice")), eq(recurringInvoices.businessId, b.id)));
      if (!cur) throw notFound("That repeating invoice");
      if (!cur.active) throw conflict("Resume it first.");
      const r = await runOnce(tx, ctx.services, b, cur, { userId: ctx.user.id, issueDate: today() });
      if (!r) throw conflict("That one has just been made. Refresh to see it.");
      return r;
    });
    if (res.emailId) await ctx.services.email.deliver(ctx.db, [res.emailId]);
    return { invoiceId: res.invoiceId };
  });

  route(app, comingIn.deleteRecurring, async ({ params, ctx }) => {
    const b = ctx.business;
    const [row] = await ctx.db.delete(recurringInvoices).where(and(eq(recurringInvoices.id, idOr404(params.id, "That repeating invoice")), eq(recurringInvoices.businessId, b.id))).returning({ name: recurringInvoices.name });
    if (!row) throw notFound("That repeating invoice");
    await logActivity(ctx.db, b.id, `Repeating invoice "${row.name}" deleted`, { actorId: ctx.user.id });
    return { ok: true as const };
  });
}
