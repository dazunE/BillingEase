import { comingIn, type InvoiceRow } from "@billingease/contracts";
import { rulesFor, today } from "@billingease/core";
import { customers, invoiceLines, invoices, quotes } from "@billingease/db/schema";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../../lib/activity";
import { authenticate } from "../../lib/auth";
import { badRequest, conflict, notFound } from "../../lib/errors";
import { route } from "../../lib/route";
import {
  createCreditNote, getInvoiceRow, idOr404, invoiceDetail, invoiceEmail, invoiceFx, invoiceLink, invoiceRowsQuery, issueDraft, normalLines, openOf,
  recordPayment, reminderText, toRow, voidInvoice, voidPayment, writeDraft,
} from "../../services/invoice-core";
import { invoicePdfData, pdfFilename, quotePdfData, renderDocument } from "../../services/invoice-pdf";

function matches(status: string, r: InvoiceRow) {
  switch (status) {
    case "all": return true;
    case "unpaid": return r.status === "sent" || r.status === "part_paid";
    case "late": return r.shown === "late";
    default: return r.status === status;
  }
}

export async function invoiceRoutes(app: FastifyInstance) {
  route(app, comingIn.listInvoices, async ({ query, ctx }) => {
    const b = ctx.business;
    const like = query.q ? `%${query.q.replace(/[%_]/g, "")}%` : null;
    const rows = await invoiceRowsQuery(ctx.db).where(and(
      eq(invoices.businessId, b.id),
      eq(invoices.kind, query.kind),
      query.customerId ? eq(invoices.customerId, query.customerId) : undefined,
      query.from ? gte(invoices.issueDate, query.from) : undefined,
      query.to ? lte(invoices.issueDate, query.to) : undefined,
      like ? or(ilike(invoices.number, like), ilike(customers.name, like), ilike(invoices.reference, like),
        sql`exists (select 1 from ${invoiceLines} where ${invoiceLines.invoiceId} = ${invoices.id} and ${invoiceLines.description} ilike ${like})`) : undefined,
    )).orderBy(desc(invoices.issueDate), desc(invoices.createdAt));
    const now = today();
    const all = rows.map((r) => toRow(r, now));
    const list = all.filter((r) => matches(query.status, r));
    if (query.status === "unpaid" || query.status === "late") list.sort((a, c) => a.dueDate.localeCompare(c.dueDate));
    const live = list.filter((r) => r.status !== "draft" && r.status !== "void");
    // Totals are in the home currency: each invoice at its own rate.
    const sum = (xs: InvoiceRow[], k: "homeTotal" | "homeOpen") => xs.reduce((a, r) => a + r[k], 0);
    const total = sum(live, "homeTotal"), open = sum(live, "homeOpen");
    return {
      invoices: list,
      totals: { count: list.length, total, open, late: sum(live.filter((r) => r.shown === "late"), "homeOpen"), paid: total - open },
      counts: {
        all: all.length,
        draft: all.filter((r) => matches("draft", r)).length,
        unpaid: all.filter((r) => matches("unpaid", r)).length,
        late: all.filter((r) => matches("late", r)).length,
        paid: all.filter((r) => matches("paid", r)).length,
        void: all.filter((r) => matches("void", r)).length,
      },
    };
  });

  route(app, comingIn.getInvoice, ({ params, ctx }) => invoiceDetail(ctx.db, ctx.business, params.id));

  route(app, comingIn.createInvoice, async ({ body, ctx }) => {
    const b = ctx.business;
    const id = await ctx.db.transaction(async (tx) => {
      const id = await writeDraft(tx, b, { ...body, ...(await invoiceFx(tx, ctx.services, b, body)), lines: normalLines(body.lines, b) });
      await logActivity(tx, b.id, "Draft invoice started", { actorId: ctx.user.id, link: invoiceLink(id) });
      return id;
    });
    return invoiceDetail(ctx.db, b, id);
  });

  route(app, comingIn.updateInvoice, async ({ body, params, ctx }) => {
    const b = ctx.business;
    await ctx.db.transaction(async (tx) => {
      const inv = await getInvoiceRow(tx, b.id, params.id, { forUpdate: true });
      if (inv.status !== "draft") throw conflict(`${inv.number} has been issued, so it can't be changed. Give a credit note, or void it and issue a new one.`);
      await writeDraft(tx, b, { ...body, ...(await invoiceFx(tx, ctx.services, b, body)), id: inv.id, lines: normalLines(body.lines, b) });
    });
    return invoiceDetail(ctx.db, b, params.id);
  });

  route(app, comingIn.deleteInvoice, async ({ params, ctx }) => {
    const b = ctx.business;
    await ctx.db.transaction(async (tx) => {
      const inv = await getInvoiceRow(tx, b.id, params.id, { forUpdate: true });
      if (inv.status !== "draft") throw conflict("Only drafts can be deleted. Void an issued invoice instead.");
      if (inv.quoteId) await tx.update(quotes).set({ status: "accepted", invoiceId: null }).where(and(eq(quotes.id, inv.quoteId), eq(quotes.businessId, b.id)));
      await tx.delete(invoices).where(and(eq(invoices.id, inv.id), eq(invoices.businessId, b.id)));
      await logActivity(tx, b.id, "Draft invoice deleted", { actorId: ctx.user.id });
    });
    return { ok: true as const };
  });

  route(app, comingIn.issueInvoice, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const res = await ctx.db.transaction((tx) => issueDraft(tx, ctx.services, b, params.id, { userId: ctx.user.id, email: body.email, message: body.message, replyTo: b.email ?? ctx.user.email }));
    if (res.emailId) await ctx.services.email.deliver(ctx.db, [res.emailId]);
    return { ...(await invoiceDetail(ctx.db, b, params.id)), emailed: !!res.emailId };
  });

  route(app, comingIn.emailInvoice, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const emailId = await ctx.db.transaction(async (tx) => {
      const inv = await getInvoiceRow(tx, b.id, params.id);
      if (inv.status === "draft" || !inv.number) throw conflict("Send the invoice first.");
      if (inv.status === "void") throw conflict("This invoice was voided.");
      const [c] = await tx.select().from(customers).where(and(eq(customers.id, inv.customerId), eq(customers.businessId, b.id)));
      if (!c.email) throw badRequest(`Add an email address for ${c.name} first.`, { email: "No email for this customer" });
      const title = inv.kind === "credit_note" ? "Credit note" : (inv.snapshot?.title ?? "Invoice");
      const m = invoiceEmail(b, c, { number: inv.number, total: inv.total, currency: inv.currency, dueDate: inv.dueDate, title }, body.message);
      const id = await ctx.services.email.queue(tx, { businessId: b.id, to: c.email, replyTo: b.email ?? ctx.user.email, subject: m.subject, text: m.text, attachInvoiceId: inv.id });
      await logActivity(tx, b.id, `${title} ${inv.number} emailed to ${c.email}`, { actorId: ctx.user.id, link: invoiceLink(inv.id) });
      return id;
    });
    await ctx.services.email.deliver(ctx.db, [emailId]);
    return { ok: true as const };
  });

  route(app, comingIn.voidInvoice, async ({ body, params, ctx }) => {
    const b = ctx.business;
    await ctx.db.transaction((tx) => voidInvoice(tx, b, params.id, ctx.user.id, body.reason));
    return invoiceDetail(ctx.db, b, params.id);
  });

  route(app, comingIn.recordPayment, async ({ body, params, ctx }) => {
    const b = ctx.business;
    await ctx.db.transaction((tx) => recordPayment(tx, ctx.services, b, params.id, ctx.user.id, body));
    return invoiceDetail(ctx.db, b, params.id);
  });

  route(app, comingIn.voidPayment, async ({ params, ctx }) => {
    const b = ctx.business;
    await ctx.db.transaction((tx) => voidPayment(tx, b, params.id, params.paymentId, ctx.user.id));
    return invoiceDetail(ctx.db, b, params.id);
  });

  route(app, comingIn.creditNote, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const res = await ctx.db.transaction((tx) => createCreditNote(tx, ctx.services, b, params.id, ctx.user.id, body));
    if (res.emailId) await ctx.services.email.deliver(ctx.db, [res.emailId]);
    return invoiceDetail(ctx.db, b, res.id);
  });

  route(app, comingIn.remind, async ({ body, params, ctx }) => {
    const b = ctx.business;
    const rules = rulesFor(b.country);
    const res = await ctx.db.transaction(async (tx) => {
      const inv = await getInvoiceRow(tx, b.id, params.id, { forUpdate: true });
      if (inv.kind !== "invoice" || (inv.status !== "sent" && inv.status !== "part_paid") || openOf(inv) <= 0) throw conflict("There's nothing left to pay on this invoice.");
      const [c] = await tx.select().from(customers).where(and(eq(customers.id, inv.customerId), eq(customers.businessId, b.id)));
      const message = body.message?.trim() || reminderText(b, c, inv);
      const whatsappUrl = rules.features.whatsapp ? `https://wa.me/?text=${encodeURIComponent(message)}` : null;
      const wantEmail = body.email !== false;
      if (wantEmail && !c.email && !whatsappUrl) throw badRequest(`Add an email address for ${c.name} to send a reminder.`, { email: "No email for this customer" });
      let emailId: string | null = null;
      if (wantEmail && c.email) {
        emailId = await ctx.services.email.queue(tx, {
          businessId: b.id, to: c.email, replyTo: b.email ?? ctx.user.email, subject: `Reminder: invoice ${inv.number} from ${b.name}`, text: message, attachInvoiceId: inv.id,
        });
      }
      await tx.update(invoices).set({ remindersSent: inv.remindersSent + 1, lastReminderAt: new Date() }).where(and(eq(invoices.id, inv.id), eq(invoices.businessId, b.id)));
      await logActivity(tx, b.id, emailId ? `Reminder for ${inv.number} emailed to ${c.email}` : `WhatsApp reminder for ${inv.number} written for ${c.name}`, { actorId: ctx.user.id, link: invoiceLink(inv.id) });
      return { emailId, whatsappUrl, message };
    });
    if (res.emailId) await ctx.services.email.deliver(ctx.db, [res.emailId]);
    return { emailed: !!res.emailId, whatsappUrl: res.whatsappUrl, message: res.message };
  });

  // PDFs: raw application/pdf, so registered directly with the same sign-in check.
  app.get(comingIn.invoicePdf.path, async (req, reply) => {
    const ctx = await authenticate(app, req, comingIn.invoicePdf);
    const id = idOr404((req.params as { id?: string }).id, "That invoice");
    const d = await invoicePdfData(ctx.db, ctx.business!.id, id, ctx.services.storage);
    if (!d) throw notFound("That invoice");
    const bytes = await renderDocument(d);
    const download = (req.query as { download?: string }).download === "1";
    return reply.header("content-type", "application/pdf").header("cache-control", "private, no-store")
      .header("content-disposition", `${download ? "attachment" : "inline"}; filename="${pdfFilename(d.number, d.kind)}"`).send(Buffer.from(bytes));
  });

  app.get(comingIn.quotePdf.path, async (req, reply) => {
    const ctx = await authenticate(app, req, comingIn.quotePdf);
    const id = idOr404((req.params as { id?: string }).id, "That quote");
    const d = await quotePdfData(ctx.db, ctx.business!.id, id, ctx.services.storage);
    if (!d) throw notFound("That quote");
    const bytes = await renderDocument(d);
    const download = (req.query as { download?: string }).download === "1";
    return reply.header("content-type", "application/pdf").header("cache-control", "private, no-store")
      .header("content-disposition", `${download ? "attachment" : "inline"}; filename="${pdfFilename(d.number, d.kind)}"`).send(Buffer.from(bytes));
  });
}

