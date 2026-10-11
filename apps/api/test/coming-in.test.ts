import { accountTotals, trialBalance } from "@billingease/db";
import { invoices, lockedPeriods, notifications, outboxEmails, recurringInvoices } from "@billingease/db/schema";
import { and, eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runDueRecurring } from "../src/services/recurring-run";
import { as, signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

type Api = Awaited<ReturnType<typeof signUpWithBusiness>>["api"];

/** Net balance (debit − credit) per account code across the whole ledger. */
async function balances(businessId: string) {
  const rows = await accountTotals(t.db, businessId, "2000-01-01", "2100-12-31");
  return Object.fromEntries(rows.map((r) => [r.code, r.debit - r.credit])) as Record<string, number>;
}

async function balanced(businessId: string) {
  const tb = await trialBalance(t.db, businessId);
  expect(tb.debit).toBe(tb.credit);
  return tb;
}

async function customer(api: Api, extra: Record<string, unknown> = {}) {
  const r = await api.post("/customers", { name: "Ochre Café", contactName: "Sam Okafor", email: "sam@ochrecafe.co.uk", address: "7 Fossgate, York YO1 9TA", ...extra });
  expect(r.status).toBe(200);
  return r.body;
}

async function pdfBytes(token: string, businessId: string, url: string) {
  const res = await t.app.inject({ method: "GET", url, headers: { authorization: `Bearer ${token}`, "x-business-id": businessId } });
  return res;
}

describe("UK invoices (not VAT registered)", () => {
  it("drafts, issues, emails with the PDF, takes payments and keeps the ledger balanced", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk");
    const c = await customer(api);
    expect(c).toMatchObject({ taxId: null, owed: 0 });
    const item = (await api.post("/items", { name: "Design hours", unit: "hour", unitPrice: 5500, vatRateId: null, sscl: true })).body;
    expect(item).toMatchObject({ unitPrice: 5500, sscl: false });

    const draft = await api.post("/invoices", {
      customerId: c.id, issueDate: "2026-10-08",
      lines: [
        { itemId: item.id, description: "Design hours", quantityMilli: 6000, unitPrice: 5500 },
        { description: "A-board artwork", quantityMilli: 1000, unitPrice: 12000 },
      ],
    });
    expect(draft.status).toBe(200);
    expect(draft.body).toMatchObject({ status: "draft", number: null, total: 45000, vat: 0, sscl: 0, dueDate: "2026-10-22", title: "Invoice" });
    expect(draft.body.lines.map((l: { net: number }) => l.net)).toEqual([33000, 12000]);
    // A draft posts nothing.
    expect((await trialBalance(t.db, business.id)).debit).toBe(0);

    // Edit the draft: lines are recomputed and stored per line.
    const edited = await api.patch(`/invoices/${draft.body.id}`, {
      customerId: c.id, issueDate: "2026-10-08", notes: "Thanks for your business",
      lines: [
        { itemId: item.id, description: "Design hours", quantityMilli: 6000, unitPrice: 5500 },
        { description: "A-board artwork", quantityMilli: 1000, unitPrice: 12000 },
      ],
    });
    expect(edited.body.notes).toBe("Thanks for your business");

    const issued = await api.post(`/invoices/${draft.body.id}/issue`, { email: true });
    expect(issued.status).toBe(200);
    expect(issued.body).toMatchObject({ status: "sent", number: "HS-0001", emailed: true, title: "Invoice" });
    expect(issued.body.snapshot.seller.name).toBe("Harper Studio");
    expect(issued.body.activity[0].message).toContain("HS-0001 emailed to Ochre Café");
    expect(issued.body.emails[0]).toMatchObject({ to: "sam@ochrecafe.co.uk", status: "sent" });

    // The outbox row and the delivered email with the PDF attached.
    const [mail] = await t.db.select().from(outboxEmails).where(and(eq(outboxEmails.businessId, business.id), eq(outboxEmails.attachInvoiceId, draft.body.id)));
    expect(mail).toMatchObject({ toEmail: "sam@ochrecafe.co.uk", subject: "Invoice HS-0001 from Harper Studio", status: "sent" });
    const sent = t.sent.find((m) => m.subject === "Invoice HS-0001 from Harper Studio")!;
    expect(sent.text).toContain("£450.00");
    expect(sent.attachments[0].filename).toBe("HS-0001.pdf");
    expect(Buffer.from(sent.attachments[0].content).subarray(0, 4).toString()).toBe("%PDF");

    // The PDF endpoint.
    const pdf = await pdfBytes(token, business.id, `/invoices/${draft.body.id}/pdf`);
    expect(pdf.statusCode).toBe(200);
    expect(pdf.headers["content-type"]).toBe("application/pdf");
    expect(pdf.rawPayload.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.rawPayload.toString("latin1")).toContain("HS-0001");
    expect((await PDFDocument.load(pdf.rawPayload)).getTitle()).toBe("Invoice HS-0001 from Harper Studio");

    // Ledger: receivable 450, sales 450.
    await balanced(business.id);
    let bal = await balances(business.id);
    expect(bal["1100"]).toBe(45000);
    expect(bal["4000"]).toBe(-45000);

    // Issued invoices can't be edited or deleted.
    expect((await api.patch(`/invoices/${draft.body.id}`, { customerId: c.id, issueDate: "2026-10-08", lines: [] })).status).toBe(409);
    expect((await api.del(`/invoices/${draft.body.id}`)).status).toBe(409);

    // Payments: too much, wrong method, part, then the rest.
    expect((await api.post(`/invoices/${draft.body.id}/payments`, { amount: 50000, receivedOn: "2026-10-09", method: "Bank transfer" })).status).toBe(400);
    expect((await api.post(`/invoices/${draft.body.id}/payments`, { amount: 100, receivedOn: "2026-10-09", method: "LankaQR" })).status).toBe(400);
    expect((await api.post(`/invoices/${draft.body.id}/payments`, { amount: 100, receivedOn: "2026-12-09", method: "Cash" })).status).toBe(400);
    const part = await api.post(`/invoices/${draft.body.id}/payments`, { amount: 20000, receivedOn: "2026-10-09", method: "Cash" });
    expect(part.body).toMatchObject({ status: "part_paid", paid: 20000, open: 25000 });
    const rest = await api.post(`/invoices/${draft.body.id}/payments`, { amount: 25000, receivedOn: "2026-10-10", method: "Bank transfer", reference: "OCHRE OCT" });
    expect(rest.body).toMatchObject({ status: "paid", paid: 45000, open: 0 });
    await balanced(business.id);
    bal = await balances(business.id);
    expect(bal["1100"]).toBe(0);
    expect(bal["1010"]).toBe(20000);
    expect(bal["1000"]).toBe(25000);

    // Remove a payment: reversed in the ledger, invoice back to part paid.
    const removed = await api.post(`/invoices/${draft.body.id}/payments/${rest.body.receipts[1].id}/void`, {});
    expect(removed.body).toMatchObject({ status: "part_paid", paid: 20000 });
    expect((await balances(business.id))["1100"]).toBe(25000);
    // Can't void an invoice with money on it.
    expect((await api.post(`/invoices/${draft.body.id}/void`, {})).status).toBe(409);

    // The summary agrees.
    const s = await api.get("/in/summary?period=month");
    expect(s.body).toMatchObject({ received: 20000, onTheWay: 25000, total: 45000, period: { key: "month", label: "October 2026" } });
    expect(s.body.numbers).toEqual({ invoice: "HS-0002", quote: "HS-Q-0001", creditNote: "HS-CN-0001" });
    expect(s.body.periods.map((p: { key: string }) => p.key)).toEqual(["month", "quarter", "year"]);

    // The customer's totals.
    const cd = await api.get(`/customers/${c.id}`);
    expect(cd.body.customer).toMatchObject({ owed: 25000, paid: 20000, openCount: 1 });
    expect(cd.body.paidThisYear).toBe(20000);
    expect(cd.body.invoices).toHaveLength(1);
  });

  it("shows late invoices, sends reminders and voids an unpaid invoice", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const c = await customer(api);
    const d = await api.post("/invoices", { customerId: c.id, issueDate: "2026-09-01", dueDate: "2026-09-15", lines: [{ description: "Window graphics", quantityMilli: 1000, unitPrice: 45000 }] });
    const inv = (await api.post(`/invoices/${d.body.id}/issue`, { email: false })).body;
    expect(inv).toMatchObject({ shown: "late", daysLate: 26, emailed: false });
    expect((await api.get("/invoices?status=late")).body.invoices.map((i: { id: string }) => i.id)).toEqual([inv.id]);
    const sum = (await api.get("/in/summary")).body;
    expect(sum).toMatchObject({ late: 45000, lateCount: 1, period: { key: "quarter" } });
    expect(sum.lateInvoices[0].number).toBe(inv.number);

    const r = await api.post(`/invoices/${inv.id}/remind`, {});
    expect(r.body).toMatchObject({ emailed: true, whatsappUrl: null });
    expect(r.body.message).toContain("was due on 15 Sep 2026");
    expect((await api.get(`/invoices/${inv.id}`)).body.remindersSent).toBe(1);

    const v = await api.post(`/invoices/${inv.id}/void`, { reason: "Wrong customer" });
    expect(v.body.status).toBe("void");
    await balanced(business.id);
    expect((await balances(business.id))["1100"]).toBe(0);
    expect((await api.post(`/invoices/${inv.id}/remind`, {})).status).toBe(409);
  });

  it("issues a VAT invoice with VAT per line and a summary by rate", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk", { vatRegistered: true, vatNumber: "GB123456789" });
    const c = await customer(api, { vatNumber: "GB987654321" });
    const d = await api.post("/invoices", {
      customerId: c.id, issueDate: "2026-10-05", supplyDate: "2026-10-01",
      lines: [
        { description: "Design", quantityMilli: 1000, unitPrice: 10000, vatRateId: "std" },
        { description: "Children's book layout", quantityMilli: 2000, unitPrice: 5000, vatRateId: "reduced" },
        { description: "Printed leaflets", quantityMilli: 1000, unitPrice: 3000, discount: 500, vatRateId: "zero" },
      ],
    });
    expect(d.body).toMatchObject({ net: 22500, vat: 2500, total: 25000 });
    const inv = (await api.post(`/invoices/${d.body.id}/issue`, { email: false })).body;
    expect(inv.title).toBe("VAT invoice");
    expect(inv.snapshot.seller.vatNumber).toBe("GB123456789");
    expect(inv.snapshot.buyer.vatNumber).toBe("GB987654321");
    const bal = await balances(business.id);
    expect(bal).toMatchObject({ "1100": 25000, "4000": -22500, "2200": -2500 });
    const pdf = await pdfBytes(token, business.id, `/invoices/${inv.id}/pdf?download=1`);
    expect(pdf.headers["content-disposition"]).toContain('attachment; filename="HS-0001.pdf"');
    expect((await PDFDocument.load(pdf.rawPayload)).getTitle()).toBe("VAT invoice HS-0001 from Harper Studio");
    // Unknown rate.
    expect((await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-05", lines: [{ description: "X", quantityMilli: 1000, unitPrice: 100, vatRateId: "luxury" }] })).status).toBe(400);
  });

  it("gives credit notes in part and in full, never more than is owed", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const c = await customer(api);
    const d = await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-02", lines: [
      { description: "Menu pages", quantityMilli: 4000, unitPrice: 5000 },
      { description: "Cover", quantityMilli: 1000, unitPrice: 10000 },
    ] });
    const inv = (await api.post(`/invoices/${d.body.id}/issue`, { email: false })).body;
    expect(inv.total).toBe(30000);
    const cn = await api.post(`/invoices/${inv.id}/credit-notes`, { lines: [{ lineId: inv.lines[0].id, quantityMilli: 1000 }], reason: "One page dropped", email: true });
    expect(cn.status).toBe(200);
    expect(cn.body).toMatchObject({ kind: "credit_note", number: "HS-CN-0001", total: 5000, creditFor: { id: inv.id, number: "HS-0001" }, notes: "One page dropped" });
    const after = (await api.get(`/invoices/${inv.id}`)).body;
    expect(after).toMatchObject({ credited: 5000, open: 25000, status: "sent" });
    expect(after.creditNotes).toHaveLength(1);
    expect(t.sent.some((m) => m.subject === "Credit note HS-CN-0001 from Harper Studio" && m.attachments[0]?.filename === "HS-CN-0001.pdf")).toBe(true);
    await api.post(`/invoices/${inv.id}/payments`, { amount: 20000, receivedOn: "2026-10-10", method: "Bank transfer" });
    // The whole invoice again would be more than the 50 still owed.
    expect((await api.post(`/invoices/${inv.id}/credit-notes`, { full: true })).status).toBe(409);
    const cn2 = await api.post(`/invoices/${inv.id}/credit-notes`, { lines: [{ lineId: inv.lines[1].id, quantityMilli: 1000, unitPrice: 5000 }] });
    expect(cn2.body.number).toBe("HS-CN-0002");
    expect((await api.get(`/invoices/${inv.id}`)).body).toMatchObject({ status: "paid", open: 0, credited: 10000 });
    await balanced(business.id);
    expect(await balances(business.id)).toMatchObject({ "1100": 0, "4000": -20000, "1000": 20000 });
    expect((await api.get("/invoices?kind=credit_note")).body.invoices).toHaveLength(2);
  });

  it("refuses to post into a filed period, and gives the number back", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const c = await customer(api);
    await t.db.insert(lockedPeriods).values({ businessId: business.id, fromDate: "2026-07-06", toDate: "2026-10-05", label: "Q2 2026/27" });
    const d = await api.post("/invoices", { customerId: c.id, issueDate: "2026-09-30", lines: [{ description: "Late entry", quantityMilli: 1000, unitPrice: 1000 }] });
    const r = await api.post(`/invoices/${d.body.id}/issue`, { email: true });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("period_locked");
    expect((await api.get(`/invoices/${d.body.id}`)).body.status).toBe("draft");
    expect((await t.db.select().from(outboxEmails).where(eq(outboxEmails.attachInvoiceId, d.body.id)))).toHaveLength(0);
    await api.patch(`/invoices/${d.body.id}`, { customerId: c.id, issueDate: "2026-10-06", lines: [{ description: "Late entry", quantityMilli: 1000, unitPrice: 1000 }] });
    expect((await api.post(`/invoices/${d.body.id}/issue`, {})).body.number).toBe("HS-0001");
  });

  it("checks what it's given", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const bad = await api.post("/invoices", { issueDate: "11/10/2026", lines: [{ description: "", quantityMilli: 0, unitPrice: -1 }] });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields)).toEqual(expect.arrayContaining(["customerId", "issueDate", "lines.0.description", "lines.0.quantityMilli", "lines.0.unitPrice"]));
    expect((await api.post("/customers", { name: " ", email: "nope" })).body.error.fields).toMatchObject({ name: expect.any(String), email: expect.any(String) });
    const c = await customer(api, { email: null });
    const d = await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-01", lines: [] });
    expect((await api.post(`/invoices/${d.body.id}/issue`, {})).status).toBe(400);
    await api.patch(`/invoices/${d.body.id}`, { customerId: c.id, issueDate: "2026-10-01", lines: [{ description: "A", quantityMilli: 1000, unitPrice: 100 }] });
    const noEmail = await api.post(`/invoices/${d.body.id}/issue`, { email: true });
    expect(noEmail.status).toBe(400);
    expect(noEmail.body.error.fields.email).toBeTruthy();
    expect((await api.get("/invoices/not-a-uuid")).status).toBe(404);
    expect((await api.del(`/invoices/${d.body.id}`)).status).toBe(200);
    expect((await api.get(`/invoices/${d.body.id}`)).status).toBe(404);
  });
});

describe("Sri Lanka Tax Invoices", () => {
  it("adds SSCL as its own line, VAT on value plus SSCL, and records cheques", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "lk");
    const c = (await api.post("/customers", { name: "Colombo Dental Clinic", email: "office@colombodental.lk", taxId: "114223344", vatNumber: "114223344-7000", address: "12 Ward Place, Colombo 07" })).body;
    expect(c).toMatchObject({ taxId: "114223344", vatNumber: "114223344-7000" });
    const item = (await api.post("/items", { name: "Signage design", unit: "sign", unitPrice: 9500000, vatRateId: "std", sscl: true })).body;
    const d = await api.post("/invoices", {
      customerId: c.id, issueDate: "2026-10-03", supplyDate: "2026-10-01",
      lines: [
        { itemId: item.id, description: "Signage design", quantityMilli: 2000, unitPrice: 9500000, vatRateId: "std", sscl: true },
        { description: "Installation", quantityMilli: 1000, unitPrice: 4500000, vatRateId: "std", sscl: false },
      ],
    });
    expect(d.body).toMatchObject({ net: 23500000, sscl: 475000, vat: 4315500, total: 28290500, dueDate: "2026-11-02", title: "Tax Invoice" });
    expect(d.body.lines[0]).toMatchObject({ ssclAmount: 475000, vat: 3505500, sscl: true });
    expect(d.body.lines[1]).toMatchObject({ ssclAmount: 0, vat: 810000, sscl: false });

    const inv = (await api.post(`/invoices/${d.body.id}/issue`, { email: true })).body;
    expect(inv).toMatchObject({ number: "SDS-0001", title: "Tax Invoice", emailed: true });
    expect(inv.snapshot.seller).toMatchObject({ taxId: "104563218", vatNumber: "104563218-7000" });
    expect(inv.snapshot.buyer).toMatchObject({ taxId: "114223344", vatNumber: "114223344-7000" });
    await balanced(business.id);
    expect(await balances(business.id)).toMatchObject({ "1100": 28290500, "4000": -23500000, "2210": -475000, "2200": -4315500 });

    const pdf = await pdfBytes(token, business.id, `/invoices/${inv.id}/pdf`);
    expect(pdf.rawPayload.toString("latin1")).toContain("SDS-0001");
    expect((await PDFDocument.load(pdf.rawPayload)).getTitle()).toBe("Tax Invoice SDS-0001 from Serendib Design Studio");

    // A cheque needs its number in Sri Lanka.
    expect((await api.post(`/invoices/${inv.id}/payments`, { amount: 10000000, receivedOn: "2026-10-08", method: "Cheque" })).body.error.fields.chequeNumber).toBeTruthy();
    const ch = await api.post(`/invoices/${inv.id}/payments`, { amount: 10000000, receivedOn: "2026-10-08", method: "Cheque", chequeNumber: "004512", chequeDate: "2026-10-07", chequeBank: "Commercial Bank" });
    expect(ch.body).toMatchObject({ status: "part_paid", open: 18290500 });
    expect(ch.body.receipts[0]).toMatchObject({ chequeNumber: "004512", chequeDate: "2026-10-07", chequeBank: "Commercial Bank" });

    const r = await api.post(`/invoices/${inv.id}/remind`, {});
    expect(r.body.emailed).toBe(true);
    expect(r.body.whatsappUrl).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(r.body.whatsappUrl.split("text=")[1])).toContain("SDS-0001");

    const rest = await api.post(`/invoices/${inv.id}/payments`, { amount: 18290500, receivedOn: "2026-10-10", method: "Bank transfer" });
    expect(rest.body.status).toBe("paid");
    await balanced(business.id);
    expect(await balances(business.id)).toMatchObject({ "1100": 0, "1000": 28290500 });

    const s = (await api.get("/in/summary")).body;
    expect(s).toMatchObject({ received: 28290500, period: { key: "month" } });
    expect(s.periods.map((p: { key: string }) => p.key)).toEqual(["month", "year"]);
    expect((await api.get("/in/summary?period=year")).body.period.label).toBe("Year of assessment 2026/27");
  });
});

describe("quotes", () => {
  it("sends, is accepted and becomes an invoice draft", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "lk");
    const c = (await api.post("/customers", { name: "Kandyan Spice Co (Pvt) Ltd", email: "accounts@kandyanspice.lk" })).body;
    const q = await api.post("/quotes", { customerId: c.id, issueDate: "2026-10-05", notes: "Valid for 30 days", lines: [
      { description: "Spice gift set labels", quantityMilli: 3000, unitPrice: 2500000, vatRateId: "std" },
      { description: "Box design", quantityMilli: 1000, unitPrice: 6000000, vatRateId: "std", sscl: false },
    ] });
    expect(q.body).toMatchObject({ status: "draft", number: null, expiryDate: "2026-11-04" });
    const sent = await api.post(`/quotes/${q.body.id}/send`, { email: true });
    expect(sent.body).toMatchObject({ status: "sent", number: "SDS-Q-0001", emailed: true });
    const [mail] = await t.db.select().from(outboxEmails).where(eq(outboxEmails.attachQuoteId, q.body.id));
    expect(mail.subject).toBe("Quote SDS-Q-0001 from Serendib Design Studio");
    expect(t.sent.find((m) => m.subject === mail.subject)!.attachments[0].filename).toBe("SDS-Q-0001.pdf");
    const pdf = await pdfBytes(token, business.id, `/quotes/${q.body.id}/pdf`);
    expect(pdf.rawPayload.subarray(0, 4).toString()).toBe("%PDF");

    expect((await api.post(`/quotes/${q.body.id}/decision`, { decision: "accepted" })).body.status).toBe("accepted");
    const conv = await api.post(`/quotes/${q.body.id}/convert`, {});
    const inv = (await api.get(`/invoices/${conv.body.invoiceId}`)).body;
    expect(inv).toMatchObject({ status: "draft", total: q.body.total, quote: { id: q.body.id, number: "SDS-Q-0001" } });
    expect(inv.lines.map((l: { description: string }) => l.description)).toEqual(["Spice gift set labels", "Box design"]);
    expect((await api.get(`/quotes/${q.body.id}`)).body).toMatchObject({ status: "invoiced", invoiceId: inv.id });
    expect((await api.post(`/quotes/${q.body.id}/convert`, {})).status).toBe(409);
    // Quotes never touch the ledger.
    expect((await trialBalance(t.db, business.id)).debit).toBe(0);
    expect((await api.get("/quotes")).body.quotes).toHaveLength(1);
  });

  it("can be declined", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const c = await customer(api);
    const q = await api.post("/quotes", { customerId: c.id, issueDate: "2026-10-05", lines: [{ description: "Loyalty cards", quantityMilli: 1000, unitPrice: 64000 }] });
    await api.post(`/quotes/${q.body.id}/send`, { email: false });
    const d = await api.post(`/quotes/${q.body.id}/decision`, { decision: "declined", note: "Holding off until spring" });
    expect(d.body.status).toBe("declined");
    expect(d.body.activity[0].message).toContain("Holding off until spring");
    expect((await api.post(`/quotes/${q.body.id}/convert`, {})).status).toBe(409);
  });
});

describe("repeating invoices", () => {
  it("makes drafts (by default) or sends, once per run, from the job", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const c = await customer(api);
    const lines = [{ description: "Specials board artwork", quantityMilli: 1000, unitPrice: 12000 }];
    expect((await api.post("/recurring", { customerId: c.id, name: "Old", frequency: "monthly", nextRun: "2026-10-01", termsDays: 14, lines })).status).toBe(400);
    const draftOne = await api.post("/recurring", { customerId: c.id, name: "Specials board", frequency: "monthly", nextRun: "2026-10-11", termsDays: 14, lines });
    expect(draftOne.body).toMatchObject({ mode: "draft", total: 12000, upcoming: ["2026-10-11", "2026-11-11", "2026-12-11"] });
    const sendOne = await api.post("/recurring", { customerId: c.id, name: "Retainer", frequency: "weekly", nextRun: "2026-10-11", termsDays: 7, mode: "send", lines });

    const services = t.app.be.services;
    expect(await runDueRecurring(t.db, services, "2026-10-11")).toEqual({ made: 2 });
    // Safe to run twice: nothing else is due.
    expect(await runDueRecurring(t.db, services, "2026-10-11")).toEqual({ made: 0 });

    const made = await t.db.select().from(invoices).where(eq(invoices.businessId, business.id));
    const draft = made.find((i) => i.recurringId === draftOne.body.id)!;
    const issued = made.find((i) => i.recurringId === sendOne.body.id)!;
    expect(draft).toMatchObject({ status: "draft", issueDate: "2026-10-11", dueDate: "2026-10-25", total: 12000 });
    expect(issued).toMatchObject({ status: "sent", number: "HS-0001", dueDate: "2026-10-18" });
    expect(t.sent.some((m) => m.subject === "Invoice HS-0001 from Harper Studio" && m.to === "sam@ochrecafe.co.uk")).toBe(true);
    const notes = await t.db.select().from(notifications).where(eq(notifications.businessId, business.id));
    expect(notes.map((n) => n.title)).toContain("Draft invoice ready for Ochre Café");
    const [r1] = await t.db.select().from(recurringInvoices).where(eq(recurringInvoices.id, draftOne.body.id));
    expect(r1.nextRun).toBe("2026-11-11");
    await balanced(business.id);

    // A missed week catches up one run at a time.
    expect(await runDueRecurring(t.db, services, "2026-10-26")).toEqual({ made: 2 });

    const paused = await api.post(`/recurring/${draftOne.body.id}/pause`, { active: false });
    expect(paused.body).toMatchObject({ active: false, upcoming: [] });
    expect(await runDueRecurring(t.db, services, "2026-11-11")).toEqual({ made: 2 }); // 1 and 8 Nov
    const detail = await api.get(`/recurring/${sendOne.body.id}`);
    expect(detail.body.invoices).toHaveLength(5);
    const now = await api.post(`/recurring/${sendOne.body.id}/run`, {});
    expect((await api.get(`/invoices/${now.body.invoiceId}`)).body.status).toBe("sent");
    expect((await api.del(`/recurring/${draftOne.body.id}`)).status).toBe(200);
    expect((await api.get("/recurring")).body.recurring).toHaveLength(1);
  });
});

describe("tenancy", () => {
  it("keeps one business's customers, invoices and quotes from another", async () => {
    const a = await signUpWithBusiness(t.app, "uk");
    const b = await signUpWithBusiness(t.app, "lk");
    const c = await customer(a.api);
    const d = await a.api.post("/invoices", { customerId: c.id, issueDate: "2026-10-01", lines: [{ description: "A's work", quantityMilli: 1000, unitPrice: 1000 }] });
    const inv = (await a.api.post(`/invoices/${d.body.id}/issue`, {})).body;
    const q = await a.api.post("/quotes", { customerId: c.id, issueDate: "2026-10-01", lines: [{ description: "A's quote", quantityMilli: 1000, unitPrice: 1000 }] });

    expect((await b.api.get(`/invoices/${inv.id}`)).status).toBe(404);
    expect((await b.api.get("/invoices")).body.invoices).toHaveLength(0);
    expect((await b.api.get("/customers")).body.customers).toHaveLength(0);
    expect((await b.api.get(`/customers/${c.id}`)).status).toBe(404);
    expect((await b.api.get(`/quotes/${q.body.id}`)).status).toBe(404);
    expect((await b.api.post(`/invoices/${inv.id}/payments`, { amount: 100, receivedOn: "2026-10-02", method: "Bank transfer" })).status).toBe(404);
    expect((await b.api.post(`/invoices/${inv.id}/void`, {})).status).toBe(404);
    expect((await b.api.patch(`/customers/${c.id}`, { name: "Mine now" })).status).toBe(404);
    expect((await b.api.post("/invoices", { customerId: c.id, issueDate: "2026-10-01", lines: [] })).status).toBe(400);
    expect((await pdfBytes(b.token, b.business.id, `/invoices/${inv.id}/pdf`)).statusCode).toBe(404);
    // Asking for A's business with B's session is refused outright.
    expect((await as(t.app, b.token, a.business.id).get(`/invoices/${inv.id}`)).status).toBe(403);
    expect((await pdfBytes(b.token, a.business.id, `/invoices/${inv.id}/pdf`)).statusCode).toBe(403);
    expect((await a.api.get(`/invoices/${inv.id}`)).body.number).toBe("HS-0001");
  });
});

describe("customers and prices", () => {
  it("archives, searches and keeps Sri Lankan TINs", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    const one = (await api.post("/customers", { name: "Hill Country Tea Estates", taxId: "123", vatNumber: "123-7000" })).body;
    await api.post("/customers", { name: "Galle Fort Boutique Hotel" });
    expect((await api.get("/customers?q=galle")).body.customers.map((c: { name: string }) => c.name)).toEqual(["Galle Fort Boutique Hotel"]);
    await api.post(`/customers/${one.id}/archive`, { archived: true });
    expect((await api.get("/customers")).body.customers).toHaveLength(1);
    expect((await api.get("/customers?archived=true")).body.customers[0]).toMatchObject({ taxId: "123", archived: true });
    const item = (await api.post("/items", { name: "Packaging design", unitPrice: 15000000, vatRateId: "std", sscl: false })).body;
    expect(item.sscl).toBe(false);
    expect((await api.post("/items", { name: "X", unitPrice: 100, vatRateId: "reduced" })).status).toBe(400);
    expect((await api.patch(`/items/${item.id}`, { name: "Packaging design", unitPrice: 16000000, vatRateId: "std", sscl: true })).body).toMatchObject({ unitPrice: 16000000, sscl: true });
    await api.post(`/items/${item.id}/archive`, { archived: true });
    expect((await api.get("/items")).body.items).toHaveLength(0);
  });
});
