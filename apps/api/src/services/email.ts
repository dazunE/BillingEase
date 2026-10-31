import { outboxEmails, type OutboxStatus } from "@billingease/db/schema";
import type { Exec } from "@billingease/db";
import { and, asc, eq, inArray, lt, or, sql } from "drizzle-orm";
import type { Config } from "../config";
import type { InlineImage } from "./email-html";

export type OutgoingEmail = {
  businessId: string | null;
  to: string;
  replyTo?: string | null;
  subject: string;
  text: string;
  link?: string | null;
  attachInvoiceId?: string | null;
  attachQuoteId?: string | null;
};

export type Attachment = { filename: string; contentType: string; content: Uint8Array };

/** Something that can actually send an email. */
export interface EmailTransport {
  send(m: { from: string; to: string; replyTo?: string | null; subject: string; text: string; html?: string | null; inline?: InlineImage[]; attachments: Attachment[] }): Promise<void>;
}

class PostmarkTransport implements EmailTransport {
  constructor(private token: string) {}
  async send(m: Parameters<EmailTransport["send"]>[0]) {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "x-postmark-server-token": this.token },
      body: JSON.stringify({
        From: m.from, To: m.to, ReplyTo: m.replyTo ?? undefined, Subject: m.subject, TextBody: m.text, HtmlBody: m.html ?? undefined, MessageStream: "outbound",
        Attachments: [
          ...m.attachments.map((a) => ({ Name: a.filename, ContentType: a.contentType, Content: Buffer.from(a.content).toString("base64") })),
          ...(m.inline ?? []).map((a) => ({ Name: a.filename, ContentType: a.contentType, Content: Buffer.from(a.content).toString("base64"), ContentID: `cid:${a.contentId}` })),
        ],
      }),
    });
    if (!res.ok) throw new Error(`Postmark said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/**
 * Email goes through the outbox table. Queue it inside the transaction that caused it, then
 * deliver after commit. With no provider set up, emails are kept in the outbox (status
 * "kept") so development and demos never send real mail.
 */
export function createEmail(config: Config, opts: { transport?: EmailTransport | null; render?: (db: Exec, m: typeof outboxEmails.$inferSelect) => Promise<Attachment[]> } = {}) {
  const transport = opts.transport !== undefined ? opts.transport : config.email.provider === "postmark" && config.email.postmarkToken ? new PostmarkTransport(config.email.postmarkToken) : null;
  let render = opts.render ?? (async () => []);
  // The HTML version and inline logo of an email to a customer, in the business's branding.
  let extras: (db: Exec, m: typeof outboxEmails.$inferSelect) => Promise<{ html: string | null; inline: InlineImage[] }> = async () => ({ html: null, inline: [] });

  return {
    get enabled() {
      return !!transport;
    },
    /** Attachments (invoice and quote PDFs) are rendered when the email is sent. */
    setRenderer(r: typeof render) {
      render = r;
    },
    setExtras(x: typeof extras) {
      extras = x;
    },
    async queue(db: Exec, m: OutgoingEmail) {
      const [row] = await db.insert(outboxEmails).values({
        businessId: m.businessId, toEmail: m.to, replyTo: m.replyTo ?? null, subject: m.subject, bodyText: m.text, link: m.link ?? null,
        attachInvoiceId: m.attachInvoiceId ?? null, attachQuoteId: m.attachQuoteId ?? null,
        status: (transport ? "queued" : "kept") as OutboxStatus,
      }).returning({ id: outboxEmails.id });
      return row.id;
    },
    /** Sends queued emails (and retries failed or stuck ones, up to 5 tries). */
    async deliver(db: Exec, ids?: string[]) {
      if (!transport) return { sent: 0, failed: 0 };
      const stale = new Date(Date.now() - 10 * 60 * 1000);
      const due = await db.select().from(outboxEmails).where(and(
        ids ? inArray(outboxEmails.id, ids) : undefined,
        lt(outboxEmails.attempts, 5),
        or(eq(outboxEmails.status, "queued"), eq(outboxEmails.status, "failed"), and(eq(outboxEmails.status, "sending"), lt(outboxEmails.createdAt, stale))),
      )).orderBy(asc(outboxEmails.createdAt)).limit(50);
      let sent = 0, failed = 0;
      for (const m of due) {
        const claimed = await db.update(outboxEmails).set({ status: "sending", attempts: sql`${outboxEmails.attempts} + 1` })
          .where(and(eq(outboxEmails.id, m.id), eq(outboxEmails.status, m.status))).returning({ id: outboxEmails.id });
        if (!claimed.length) continue;
        try {
          const { html, inline } = await extras(db, m);
          await transport.send({ from: config.email.from, to: m.toEmail, replyTo: m.replyTo, subject: m.subject, text: m.bodyText, html, inline, attachments: await render(db, m) });
          await db.update(outboxEmails).set({ status: "sent", sentAt: new Date(), error: null }).where(eq(outboxEmails.id, m.id));
          sent++;
        } catch (err) {
          await db.update(outboxEmails).set({ status: "failed", error: String((err as Error).message ?? err).slice(0, 500) }).where(eq(outboxEmails.id, m.id));
          failed++;
        }
      }
      return { sent, failed };
    },
  };
}

export type EmailService = ReturnType<typeof createEmail>;
