import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { PDFDict, PDFDocument, PDFName, PDFString } from "pdf-lib";
import { resetDbForTests, type Db } from "@/db/client";
import { businesses, outboxEmails, users } from "@/db/schema";
import { deliverOutbox, emailInvoicePdf, invoicePdf, retryEmail, withDelivery } from "@/lib/email";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { createDefaultAccounts } from "@/lib/ledger";
import { createCustomer, createInvoice, OpError, sendInvoice, sendReminder } from "@/lib/ops";

const T = "2026-10-04";
const opts = { appUrl: "http://localhost:3000", businessName: "Northwind Studio" };
let db: Db;
let businessId: string;
let otherBusinessId: string;

beforeEach(async () => {
  db = await resetDbForTests();
  const [u] = await db.insert(users).values({ email: "maya@example.com", name: "Maya", passwordHash: "x" }).returning();
  const [b] = await db.insert(businesses).values({ ownerId: u.id, name: "Northwind Studio" }).returning();
  businessId = b.id;
  await createDefaultAccounts(db, businessId);
  const [u2] = await db.insert(users).values({ email: "other@example.com", name: "Other", passwordHash: "x" }).returning();
  const [b2] = await db.insert(businesses).values({ ownerId: u2.id, name: "Other Co" }).returning();
  otherBusinessId = b2.id;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function sentInvoice(email: string | null = "studio@greenline.example") {
  const c = await createCustomer(db, businessId, { name: "Greenline Architects", email });
  const inv = await createInvoice(db, businessId, { customerId: c.id, issueDate: T, dueDate: "2026-10-18", lines: [{ description: "Logo refresh", quantity: 1, unitCents: 125000 }] });
  await sendInvoice(db, businessId, inv.id, opts);
  return inv;
}

const text = (bytes: Uint8Array) => Buffer.from(bytes).toString("latin1");

describe("invoice PDF", () => {
  it("renders a real PDF with the invoice's details", async () => {
    const inv = await sentInvoice();
    const pdf = await invoicePdf(db, businessId, inv.id, opts.appUrl);
    expect(pdf).not.toBeNull();
    expect(pdf!.filename).toBe(`${inv.number}.pdf`);
    const s = text(pdf!.bytes);
    expect(s.startsWith("%PDF-")).toBe(true);
    const doc = await PDFDocument.load(pdf!.bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe(`Invoice ${inv.number} from Northwind Studio`);
    // the pay link is a clickable link annotation
    const annots = doc.getPage(0).node.Annots();
    const link = annots?.lookup(0, PDFDict)?.lookup(PDFName.of("A"), PDFDict)?.lookup(PDFName.of("URI"), PDFString);
    expect(link?.asString()).toMatch(/^http:\/\/localhost:3000\/i\//);
  });

  it("only gives a business its own invoices", async () => {
    const inv = await sentInvoice();
    expect(await invoicePdf(db, otherBusinessId, inv.id, opts.appUrl)).toBeNull();
  });

  it("flows long invoices onto more pages and copes with any characters", async () => {
    const lines = Array.from({ length: 60 }, (_, i) => ({
      description: `Line ${i + 1}: Crème brûlée tasting, Łódź office — ${"very long words ".repeat(i % 3 === 0 ? 8 : 1)}日本 ✓`,
      quantity: 1,
      unitCents: 1000 + i,
      amountCents: 1000 + i,
    }));
    const bytes = await renderInvoicePdf({
      business: { name: "Northwind Studio" },
      customer: { name: "Café Ünïcode", email: null, phone: null, address: "1 Main St\nSpringfield" },
      invoice: { number: "INV-0099", issueDate: T, dueDate: T, memo: "Thanks!", totalCents: 99, paidCents: 0, status: "sent" },
      lines,
    });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1);
  });
});

describe("emailing invoices", () => {
  it("attaches the invoice to the email it sends, and keeps it in the outbox without an email service", async () => {
    const inv = await sentInvoice();
    const [m] = await db.select().from(outboxEmails).where(eq(outboxEmails.businessId, businessId));
    expect(m.invoiceId).toBe(inv.id);
    expect(m.status).toBe("kept");
    expect(m.bodyText).toContain("PDF is attached");
    expect(await deliverOutbox(db, businessId, { appUrl: opts.appUrl })).toEqual({ sent: 0, failed: [] });
  });

  it("sends queued emails through Resend with the PDF attached, once", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const calls: { headers: Record<string, string>; body: { to: string[]; reply_to: string[]; attachments: { filename: string; content: string }[] } }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        calls.push({ headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
        return new Response(JSON.stringify({ id: "em_1" }), { status: 200 });
      }),
    );
    const inv = await sentInvoice();
    const [queued] = await db.select().from(outboxEmails).where(eq(outboxEmails.businessId, businessId));
    expect(queued.status).toBe("queued");

    const r = await deliverOutbox(db, businessId, { appUrl: opts.appUrl });
    expect(r).toEqual({ sent: 1, failed: [] });
    expect(calls).toHaveLength(1);
    expect(calls[0].body.to).toEqual(["studio@greenline.example"]);
    expect(calls[0].body.reply_to).toEqual(["maya@example.com"]);
    expect(calls[0].headers["Idempotency-Key"]).toBe(`outbox-${queued.id}`);
    expect(calls[0].body.attachments[0].filename).toBe(`${inv.number}.pdf`);
    expect(Buffer.from(calls[0].body.attachments[0].content, "base64").subarray(0, 5).toString()).toBe("%PDF-");

    const [after] = await db.select().from(outboxEmails).where(eq(outboxEmails.id, queued.id));
    expect(after.status).toBe("sent");
    expect(after.sentAt).not.toBeNull();
    // nothing left to send
    await deliverOutbox(db, businessId, { appUrl: opts.appUrl });
    expect(calls).toHaveLength(1);
  });

  it("keeps a failed email with the reason, and can try it again", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    let ok = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => (ok ? new Response(JSON.stringify({ id: "em_2" }), { status: 200 }) : new Response(JSON.stringify({ message: "Domain not verified" }), { status: 403 }))),
    );
    const inv = await sentInvoice();
    await sendReminder(db, businessId, inv.id, opts);
    const r = await deliverOutbox(db, businessId, { appUrl: opts.appUrl });
    expect(r.sent).toBe(0);
    expect(r.failed).toHaveLength(2);
    expect(withDelivery("Reminder sent", r)).toContain("didn't go out (Domain not verified)");

    const [failed] = await db.select().from(outboxEmails).where(eq(outboxEmails.businessId, businessId)).limit(1);
    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("Domain not verified");

    ok = true;
    expect(await retryEmail(db, businessId, failed.id, { appUrl: opts.appUrl })).toEqual({ sent: 1, failed: [] });
    await expect(retryEmail(db, businessId, failed.id, { appUrl: opts.appUrl })).rejects.toThrow(OpError);
    await expect(retryEmail(db, otherBusinessId, failed.id, { appUrl: opts.appUrl })).rejects.toThrow(OpError);
  });

  it("emails a copy of the PDF to any address", async () => {
    const inv = await sentInvoice(null);
    await emailInvoicePdf(db, businessId, inv.id, { to: "accounts@greenline.example", note: "For your records" }, opts);
    const mail = await db.select().from(outboxEmails).where(eq(outboxEmails.businessId, businessId));
    expect(mail).toHaveLength(1);
    expect(mail[0].toEmail).toBe("accounts@greenline.example");
    expect(mail[0].invoiceId).toBe(inv.id);
    expect(mail[0].bodyText).toContain("For your records");
    expect(mail[0].bodyText).toMatch(/^Hi,/);

    await expect(emailInvoicePdf(db, businessId, inv.id, { to: "not an email" }, opts)).rejects.toThrow(/email address/);
    await expect(emailInvoicePdf(db, otherBusinessId, inv.id, { to: "a@b.co" }, opts)).rejects.toThrow(/wasn't found/);
    const c = await createCustomer(db, businessId, { name: "Oak", email: "o@oak.example" });
    const draft = await createInvoice(db, businessId, { customerId: c.id, issueDate: T, dueDate: T, lines: [{ description: "x", quantity: 1, unitCents: 100 }] });
    await expect(emailInvoicePdf(db, businessId, draft.id, { to: "o@oak.example" }, opts)).rejects.toThrow(/Send the invoice first/);
  });
});
