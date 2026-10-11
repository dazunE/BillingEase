import { comingIn } from "@billingease/contracts";
import { formatDate, today } from "@billingease/core";
import { customers, quoteLines, quotes } from "@billingease/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../../lib/activity";
import { badRequest, conflict } from "../../lib/errors";
import { route } from "../../lib/route";
import { invoiceLink, money, normalLines, quoteLink, snapshotFor, storedLines, writeDraft } from "../../services/invoice-core";
import { nextNumber } from "../../services/numbering";
import { getQuoteRow, quoteDetail, quoteRowsQuery, toQuoteRow, writeQuote } from "../../services/quote-core";
import type { Exec } from "@billingease/db";
import type { BusinessRow } from "../../lib/context";

/** Gives a quote its number and freezes the seller and buyer, the first time it leaves draft. */
async function numberQuote(tx: Exec, b: BusinessRow, q: typeof quotes.$inferSelect) {
  if (q.number) return q.number;
  const [c] = await tx.select().from(customers).where(and(eq(customers.id, q.customerId), eq(customers.businessId, b.id)));
  const number = await nextNumber(tx, b.id, "quote");
  await tx.update(quotes).set({ number, vatRegistered: b.vatRegistered, snapshot: { ...snapshotFor(b, c, b.vatRegistered), title: "Quote" } })
    .where(and(eq(quotes.id, q.id), eq(quotes.businessId, b.id)));
  return number;
}

export async function quoteRoutes(app: FastifyInstance) {
  route(app, comingIn.listQuotes, async ({ query, ctx }) => {
    const b = ctx.business;
    const rows = await quoteRowsQuery(ctx.db).where(and(
      eq(quotes.businessId, b.id),
      query.status !== "all" ? eq(quotes.status, query.status) : undefined,
      query.customerId ? eq(quotes.customerId, query.customerId) : undefined,
    )).orderBy(desc(quotes.issueDate), desc(quotes.createdAt));
    const list = rows.map(toQuoteRow);
    const sum = (s: string) => list.filter((q) => q.status === s).reduce((a, q) => a + q.total, 0);
    return { quotes: list, totals: { waiting: sum("sent"), draft: sum("draft"), accepted: sum("accepted") } };
  });

  route(app, comingIn.getQuote, ({ params, ctx }) => quoteDetail(ctx.db, ctx.business, params.id));

  route(app, comingIn.createQuote, async ({ body, ctx }) => {
    const b = ctx.business;
    const id = await ctx.db.transaction(async (tx) => {
      const id = await writeQuote(tx, b, { ...body, lines: normalLines(body.lines, b) });
      await logActivity(tx, b.id, "Quote started", { actorId: ctx.user.id, link: quoteLink(id) });
      return id;
    });
    return quoteDetail(ctx.db, b, id);
  });

  route(app, comingIn.updateQuote, async ({ body, params, ctx }) => {
    const b = ctx.business;
    await ctx.db.transaction(async (tx) => {
      const q = await getQuoteRow(tx, b.id, params.id);
      if (q.status !== "draft" && q.status !== "sent") throw conflict(`This quote has been ${q.status}, so it can't be changed.`);
      await writeQuote(tx, b, { ...body, id: q.id, lines: normalLines(body.lines, b) });
      if (q.status === "sent") await logActivity(tx, b.id, `Quote ${q.number} changed`, { actorId: ctx.user.id, link: quoteLink(q.id) });
    });
    return quoteDetail(ctx.db, b, params.id);
  });

  route(app, comingIn.deleteQuote, async ({ params, ctx }) => {
    const b = ctx.business;
    const q = await getQuoteRow(ctx.db, b.id, params.id);
    if (q.status !== "draft") throw conflict("Only draft quotes can be deleted. Mark it declined instead.");
    await ctx.db.delete(quotes).where(and(eq(quotes.id, q.id), eq(quotes.businessId, b.id)));
    return { ok: true as const };
  });

  route(app, comingIn.sendQuote, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const res = await ctx.db.transaction(async (tx) => {
      const q = await getQuoteRow(tx, b.id, params.id);
      if (q.status !== "draft" && q.status !== "sent") throw conflict(`This quote has already been ${q.status}.`);
      const has = await tx.select({ id: quoteLines.id }).from(quoteLines).where(and(eq(quoteLines.quoteId, q.id), eq(quoteLines.businessId, b.id))).limit(1);
      if (!has.length || q.total <= 0) throw badRequest("Add a line with a price before sending.", { lines: "Add a line" });
      const [c] = await tx.select().from(customers).where(and(eq(customers.id, q.customerId), eq(customers.businessId, b.id)));
      if (body.email && !c.email) throw badRequest(`Add an email address for ${c.name} to email it.`, { email: "No email for this customer" });
      const number = await numberQuote(tx, b, q);
      await tx.update(quotes).set({ status: "sent", sentAt: new Date(), updatedAt: new Date() }).where(and(eq(quotes.id, q.id), eq(quotes.businessId, b.id)));
      let emailId: string | null = null;
      if (body.email && c.email) {
        const text = [
          c.contactName ? `Hello ${c.contactName.split(/\s+/)[0]},` : "Hello,", "",
          body.message?.trim() || `Here is quote ${number} for ${money(b, q.total)}. It's valid until ${formatDate(q.expiryDate, { year: true })}. The PDF is attached; just reply to say yes.`,
          "", "Thank you,", b.name,
        ].join("\n");
        emailId = await ctx.services.email.queue(tx, { businessId: b.id, to: c.email, replyTo: b.email ?? ctx.user.email, subject: `Quote ${number} from ${b.name}`, text, attachQuoteId: q.id });
      }
      await logActivity(tx, b.id, emailId ? `Quote ${number} emailed to ${c.name} (${c.email})` : `Quote ${number} marked as sent to ${c.name}`, { actorId: ctx.user.id, link: quoteLink(q.id) });
      return { emailId };
    });
    if (res.emailId) await ctx.services.email.deliver(ctx.db, [res.emailId]);
    return { ...(await quoteDetail(ctx.db, b, params.id)), emailed: !!res.emailId };
  });

  route(app, comingIn.decideQuote, async ({ body, params, ctx }) => {
    const b = ctx.business;
    await ctx.db.transaction(async (tx) => {
      const q = await getQuoteRow(tx, b.id, params.id);
      if (q.status === "invoiced") throw conflict("This quote has already become an invoice.");
      const number = await numberQuote(tx, b, q);
      await tx.update(quotes).set({ status: body.decision, decidedAt: new Date(), updatedAt: new Date() }).where(and(eq(quotes.id, q.id), eq(quotes.businessId, b.id)));
      const [c] = await tx.select({ name: customers.name }).from(customers).where(and(eq(customers.id, q.customerId), eq(customers.businessId, b.id)));
      await logActivity(tx, b.id, `${c.name} ${body.decision} quote ${number}${body.note ? `: "${body.note}"` : ""}`, { actorId: ctx.user.id, link: quoteLink(q.id) });
    });
    return quoteDetail(ctx.db, b, params.id);
  });

  route(app, comingIn.convertQuote, async ({ params, ctx }) => {
    const b = ctx.business;
    const invoiceId = await ctx.db.transaction(async (tx) => {
      const q = await getQuoteRow(tx, b.id, params.id);
      if (q.status === "invoiced") throw conflict("This quote has already become an invoice.");
      if (q.status === "declined") throw conflict("This quote was declined. Mark it accepted first.");
      const lines = await tx.select().from(quoteLines).where(and(eq(quoteLines.quoteId, q.id), eq(quoteLines.businessId, b.id))).orderBy(asc(quoteLines.position));
      if (!lines.length) throw badRequest("The quote has no lines to invoice.");
      const number = await numberQuote(tx, b, q);
      const id = await writeDraft(tx, b, { customerId: q.customerId, issueDate: today(), notes: q.notes, quoteId: q.id, lines: storedLines(lines) });
      await tx.update(quotes).set({ status: "invoiced", invoiceId: id, decidedAt: q.decidedAt ?? new Date(), updatedAt: new Date() }).where(and(eq(quotes.id, q.id), eq(quotes.businessId, b.id)));
      await logActivity(tx, b.id, `Quote ${number} turned into a draft invoice`, { actorId: ctx.user.id, link: quoteLink(q.id) });
      await logActivity(tx, b.id, `Draft invoice made from quote ${number}`, { actorId: ctx.user.id, link: invoiceLink(id) });
      return id;
    });
    return { invoiceId };
  });
}
