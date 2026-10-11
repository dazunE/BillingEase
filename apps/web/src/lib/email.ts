import "server-only";
import { and, asc, eq, inArray, lt, or } from "drizzle-orm";
import { businesses, invoiceLines, invoices, customers, outboxEmails, users } from "@/db/schema";
import { logActivity, sendEmail } from "./activity";
import { formatDate } from "./dates";
import { invoicePdfFilename, renderInvoicePdf, type InvoicePdfData } from "./invoice-pdf";
import type { Exec } from "./ledger";
import { formatMoney } from "./money";
import { OpError } from "./ops";
import { emailProvider } from "./providers";

/** What the invoice PDF needs, for an invoice of this business (any status). */
export async function invoicePdfData(db: Exec, businessId: string, invoiceId: string, appUrl: string): Promise<InvoicePdfData | null> {
  const [row] = await db
    .select({ invoice: invoices, customer: customers, business: businesses })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .innerJoin(businesses, eq(invoices.businessId, businesses.id))
    .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)));
  if (!row) return null;
  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId)).orderBy(asc(invoiceLines.position));
  return { ...row, lines, payLink: `${appUrl}/i/${row.invoice.publicToken}` };
}

/** The invoice as a PDF file: bytes plus a file name like INV-0007.pdf. */
export async function invoicePdf(db: Exec, businessId: string, invoiceId: string, appUrl: string) {
  const data = await invoicePdfData(db, businessId, invoiceId, appUrl);
  if (!data) return null;
  return { filename: invoicePdfFilename(data.invoice), bytes: await renderInvoicePdf(data), invoice: data.invoice };
}

// A send that never finished (the server stopped mid-send) can be retried after this long.
const STALE_SENDING_MS = 10 * 60 * 1000;

export function canRetry(m: { status: string; createdAt: Date }) {
  return m.status === "failed" || (m.status === "sending" && Date.now() - m.createdAt.getTime() > STALE_SENDING_MS);
}

/**
 * Sends this business's queued emails through the email provider, attaching
 * invoice PDFs. Call after the transaction that queued them has committed.
 * Returns what failed so the caller can say so; failures stay in the outbox
 * with the reason and can be retried.
 */
export async function deliverOutbox(db: Exec, businessId: string, opts: { appUrl: string; ids?: string[] }) {
  const provider = emailProvider();
  const failed: { to: string; error: string }[] = [];
  let sent = 0;
  if (!provider) return { sent, failed };

  const queued = await db
    .select({ id: outboxEmails.id })
    .from(outboxEmails)
    .where(and(eq(outboxEmails.businessId, businessId), eq(outboxEmails.status, "queued"), opts.ids ? inArray(outboxEmails.id, opts.ids) : undefined))
    .orderBy(asc(outboxEmails.createdAt));
  if (queued.length === 0) return { sent, failed };

  const [owner] = await db.select({ email: users.email }).from(businesses).innerJoin(users, eq(businesses.ownerId, users.id)).where(eq(businesses.id, businessId));

  for (const { id } of queued) {
    // Claim it, so two requests can't send the same email.
    const [m] = await db
      .update(outboxEmails)
      .set({ status: "sending", error: null })
      .where(and(eq(outboxEmails.id, id), eq(outboxEmails.status, "queued")))
      .returning();
    if (!m) continue;
    let result: { ok: true; id: string } | { ok: false; message: string };
    try {
      const pdf = m.invoiceId ? await invoicePdf(db, businessId, m.invoiceId, opts.appUrl) : null;
      result = await provider.send({
        id: m.id,
        to: m.toEmail,
        replyTo: owner?.email,
        subject: m.subject,
        text: m.bodyText,
        attachments: pdf ? [{ filename: pdf.filename, content: pdf.bytes }] : undefined,
      });
    } catch (err) {
      console.error("Email delivery failed", err);
      result = { ok: false, message: "Something went wrong preparing the email" };
    }
    if (result.ok) {
      sent++;
      await db.update(outboxEmails).set({ status: "sent", sentAt: new Date() }).where(eq(outboxEmails.id, m.id));
    } else {
      failed.push({ to: m.toEmail, error: result.message });
      await db.update(outboxEmails).set({ status: "failed", error: result.message }).where(eq(outboxEmails.id, m.id));
    }
  }
  return { sent, failed };
}

/** Puts a failed (or stuck) email back in the queue and tries it again. */
export async function retryEmail(db: Exec, businessId: string, emailId: string, opts: { appUrl: string }) {
  if (!emailProvider()) throw new OpError("No email service is set up, so emails stay here in the outbox.");
  const [m] = await db.select().from(outboxEmails).where(and(eq(outboxEmails.id, emailId), eq(outboxEmails.businessId, businessId)));
  if (!m || !canRetry(m)) throw new OpError("That email doesn't need sending again.");
  await db
    .update(outboxEmails)
    .set({ status: "queued", error: null })
    .where(and(eq(outboxEmails.id, emailId), or(eq(outboxEmails.status, "failed"), and(eq(outboxEmails.status, "sending"), lt(outboxEmails.createdAt, new Date(Date.now() - STALE_SENDING_MS))))));
  return deliverOutbox(db, businessId, { appUrl: opts.appUrl, ids: [emailId] });
}

/** Flash text for an action that queued emails, given how delivery went. */
export function withDelivery(done: string, r: { failed: { to: string; error: string }[] }) {
  if (r.failed.length === 0) return done;
  const f = r.failed[0];
  return `${done}, but the email to ${f.to} didn't go out (${f.error}). It's in your outbox to try again.`;
}

const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

/**
 * Emails the invoice PDF (with the pay link while it's unpaid) to any
 * address: the customer again, their accounts team, or your accountant.
 */
export async function emailInvoicePdf(
  db: Exec,
  businessId: string,
  invoiceId: string,
  input: { to: string; note?: string },
  opts: { appUrl: string; businessName: string },
) {
  const to = input.to.trim();
  if (!EMAIL_RE.test(to) || to.length > 254) throw new OpError("Enter an email address, like name@company.com.");
  const [row] = await db
    .select({ invoice: invoices, customer: customers })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)));
  if (!row) throw new OpError("That invoice wasn't found.");
  const { invoice, customer } = row;
  if (invoice.status === "draft") throw new OpError("Send the invoice first. Drafts aren't on the books yet.");
  if (invoice.status === "void") throw new OpError("This invoice was voided, so there's nothing to send.");

  const open = invoice.totalCents - invoice.paidCents;
  const link = `${opts.appUrl}/i/${invoice.publicToken}`;
  const note = input.note?.trim().slice(0, 2000);
  const greeting = to.toLowerCase() === customer.email?.toLowerCase() ? `Hi ${customer.name},` : "Hi,";
  const body =
    invoice.status === "paid"
      ? `Here's a copy of invoice ${invoice.number} for ${formatMoney(invoice.totalCents)}, paid in full. Thank you!`
      : `Here's a copy of invoice ${invoice.number} for ${formatMoney(invoice.totalCents)}, due ${formatDate(invoice.dueDate, { month: "long", day: "numeric" })}.${
          open < invoice.totalCents ? ` ${formatMoney(open)} is still open.` : ""
        }\n\nView and pay it online: ${link}`;
  await sendEmail(db, {
    businessId,
    to,
    subject: `${opts.businessName} sent you a copy of invoice ${invoice.number}`,
    text: `${greeting}\n\n${note ? `${note}\n\n` : ""}${body}\n\nThe PDF is attached.\n\nThanks,\n${opts.businessName}`,
    link,
    invoiceId: invoice.id,
  });
  await logActivity(db, businessId, `Emailed ${invoice.number} as a PDF to ${to}`);
}
