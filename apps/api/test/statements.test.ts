import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { trialBalance } from "@billingease/db";
import { bills, invoices, jobs, outboxEmails, suppliers } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { scanForLate } from "../src/agents/chaser";
import { drain } from "../src/agents/platform/queue";
import { classifyByRules, expenseFor, matchLines, mentions, methodFor, payeeFrom, type Books } from "../src/agents/statements/match";
import { loadConfig } from "../src/config";
import { fakeModels, text } from "./fake-models";
import { signUpWithBusiness } from "./helpers";
import { homeTestApp, seed } from "./home-helpers";

const books = (b: Partial<Books> = {}): Books => ({
  country: "uk", currency: "GBP", vatRegistered: true, invoices: [], bills: [], receipts: [], billPayments: [], expenses: [], suppliers: [], payeeCategories: [], ...b,
});
const line = (seq: number, description: string, amount: number, date = "2026-10-05") => ({ seq, date, description, amount, reference: null });

describe("matching", () => {
  it("reads names and methods from the bank's words", () => {
    expect(mentions("CEFT TRF FROM KANDYAN SPICE CO LTD", "Kandyan Spice Co")).toBe(true);
    expect(mentions("KANDY SPICES", "Kandyan Spice Co")).toBe(false);
    expect(methodFor("uk", "CARD PAYMENT TO PRET", -1460)).toBe("Card");
    expect(methodFor("uk", "EE LIMITED DD", -4800)).toBe("Direct debit");
    expect(methodFor("lk", "CHQ PAID 004417", -100)).toBe("Cheque");
    expect(methodFor("lk", "EE DIRECT DEBIT", -100)).toBe("Bank transfer");
    expect(payeeFrom("CARD PAYMENT TO PRET A MANGER 12OCT")).toBe("PRET A MANGER");
  });

  it("matches money in to an invoice by its number, then by amount and name, never guessing between two", () => {
    const b = books({ invoices: [
      { id: "i1", number: "HS-0007", customer: "Kirkstall Brewing Co", open: 120000 },
      { id: "i2", number: "HS-0008", customer: "Ochre Café", open: 60000 },
      { id: "i3", number: "HS-0009", customer: "Leeds Lettings", open: 60000 },
    ] });
    const d = matchLines([line(1, "FPI KIRKSTALL HS0007", 120000), line(2, "BANK CREDIT OCHRE CAFE", 60000), line(3, "BGC 0099", 60000), line(4, "FPI HS-0009 PART", 20000)], b);
    expect(d[0]).toMatchObject({ action: "propose", kind: "receipt.create", targetId: "i1", confidence: 96, payload: { amount: 120000, receivedOn: "2026-10-05", method: "Bank transfer" } });
    expect(d[1]).toMatchObject({ action: "propose", targetId: "i2", confidence: 88 });
    // £600 and no name: Ochre's is taken, so HS-0009 is the only one left owed that. Matched by amount only, so less sure.
    expect(d[2]).toMatchObject({ action: "propose", targetId: "i3", confidence: 68 });
    expect(d[3]).toMatchObject({ action: "unmatched" });
  });

  it("leaves what's already in the books, pays bills, and sends the rest to be classified", () => {
    const b = books({
      expenses: [{ id: "e1", payee: "EE", gross: 4800, date: "2026-10-03" }],
      receipts: [{ id: "r1", invoiceId: "i9", amount: 50000, date: "2026-10-04" }],
      bills: [{ id: "b1", supplier: "Leeds Print Co", reference: "LP-221", open: 14400 }],
    });
    const d = matchLines([line(1, "EE LIMITED", -4800), line(2, "BGC SOMEONE", 50000), line(3, "LEEDS PRINT CO", -14400), line(4, "PRET A MANGER", -1460)], b);
    expect(d.map((x) => x.action)).toEqual(["matched", "matched", "propose", "classify"]);
    expect(d[2]).toMatchObject({ kind: "bill_payment.create", targetId: "b1", payload: { amount: 14400, paidOn: "2026-10-05" } });
  });

  it("uses saved suppliers and earlier expenses for categories before asking the model", () => {
    const b = books({ suppliers: [{ id: "s1", name: "Adobe Systems", categoryId: "office" }], payeeCategories: [{ payee: "Pret A Manger", categoryId: "travel" }] });
    const r = classifyByRules([line(1, "ADOBE SYSTEMS SOFTWARE", -1997), line(2, "CARD PAYMENT TO PRET A MANGER", -1460), line(3, "TFR TO SAVINGS", -50000)], b);
    expect(r.known).toEqual([
      { seq: 1, kind: "business_cost", payee: "Adobe Systems", categoryId: "office", confidence: 88, supplierId: "s1" },
      { seq: 2, kind: "business_cost", payee: "Pret A Manger", categoryId: "travel", confidence: 82 },
    ]);
    expect(r.rest.map((l) => l.seq)).toEqual([3]);
  });

  it("drafts an expense for a business cost and leaves transfers and tax", () => {
    const b = books();
    const e = expenseFor(line(1, "CARD PAYMENT TO PRET A MANGER", -1460), { seq: 1, kind: "business_cost", payee: "Pret A Manger", categoryId: "travel", confidence: 80 }, b);
    expect(e).toMatchObject({ action: "propose", kind: "expense.create", confidence: 80, payload: { payee: "Pret A Manger", gross: 1460, vat: 0, method: "Card", categoryId: "travel" } });
    if (e.action === "propose") expect(e.summary).toContain("doesn't show VAT");
    expect(expenseFor(line(2, "HMRC SELF ASSESSMENT", -90000), { seq: 2, kind: "tax", payee: "HMRC", categoryId: null, confidence: 95 }, b)).toEqual({ seq: 2, action: "unmatched", note: "Looks like a tax payment: not a business cost." });
  });
});

const models = fakeModels(loadConfig({ NODE_ENV: "test" }));
let t: Awaited<ReturnType<typeof homeTestApp>>;
beforeAll(async () => { t = await homeTestApp({ models }); });
afterAll(() => t.close());

async function upload(token: string, businessId: string, filename: string, bytes: Buffer) {
  const boundary = "----be" + Math.random().toString(16).slice(2);
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`), bytes, Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const res = await t.app.inject({ method: "POST", url: "/statements", headers: { authorization: `Bearer ${token}`, "x-business-id": businessId, "content-type": `multipart/form-data; boundary=${boundary}` }, payload: body });
  return { status: res.statusCode, body: res.json() };
}

const UK_CSV = `Date,Type,Description,Value,Balance
01/10/2026,DEB,EE LIMITED,-48.00,1952.00
03/10/2026,FPI,KIRKSTALL BREWING HS-0007,1200.00,3152.00
04/10/2026,FPO,LEEDS PRINT CO LP-221,-144.00,3008.00
05/10/2026,DEB,ADOBE SYSTEMS SOFTWARE,-19.97,2988.03
06/10/2026,DEB,CARD PAYMENT TO PRET A MANGER,-14.60,2973.43
07/10/2026,TFR,TFR TO SAVINGS 4471,-500.00,2473.43`;

describe("Bank statements", () => {
  it("reads a CSV, matches it to the books, and drafts the rest with categories", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk", { vatRegistered: true, vatNumber: "GB123456789" });
    const s = seed(t.db, business.id);
    const kirk = await s.customer("Kirkstall Brewing Co");
    const inv = await s.invoice({ customerId: kirk.id, number: "HS-0007", issueDate: "2026-09-20", dueDate: "2026-10-04", total: 120000 });
    const print = await s.supplier("Leeds Print Co");
    const bill = await s.bill({ supplierId: print.id, billDate: "2026-09-25", dueDate: "2026-10-25", net: 12000, vat: 2400, reference: "LP-221" });
    await s.expense({ spentOn: "2026-10-01", gross: 4800, payee: "EE" });
    const adobe = await s.supplier("Adobe Systems");
    await t.db.update(suppliers).set({ defaultCategoryId: "office" }).where(eq(suppliers.id, adobe.id));

    models.llm.seen.length = 0;
    models.llm.script.push(text(JSON.stringify({ lines: [
      { seq: 5, kind: "business_cost", payee: "Pret A Manger", categoryId: "travel", confidence: 74 },
      { seq: 6, kind: "transfer", payee: "Savings", categoryId: null, confidence: 90 },
    ] })));
    const up = await upload(token, business.id, "barclays-oct.csv", Buffer.from(UK_CSV));
    expect(up.status).toBe(200);
    expect(up.body).toMatchObject({ format: "csv", status: "queued" });
    await drain(t.app);
    // Only the two lines nothing else could place went to the model.
    expect(models.llm.seen).toHaveLength(1);
    expect(models.llm.seen[0].contents[0].parts![0].text).toContain("PRET A MANGER");
    expect(models.llm.seen[0].contents[0].parts![0].text).not.toContain("ADOBE");

    const detail = await api.get(`/statements/${up.body.id}`);
    expect(detail.body.statement).toMatchObject({ status: "done", readBy: "header", lineCount: 6, periodFrom: "2026-10-01", periodTo: "2026-10-07", balanceProblems: 0,
      counts: { matched: 1, proposed: 4, waiting: 4, unmatched: 1, ignored: 0 } });
    expect(detail.body.lines.map((l: { status: string }) => l.status)).toEqual(["matched", "proposed", "proposed", "proposed", "proposed", "unmatched"]);
    expect(detail.body.lines[5].note).toMatch(/own accounts/);

    const waiting = (await api.get("/proposals")).body.proposals as { id: string; kind: string; title: string; targetId: string | null }[];
    expect(waiting.map((p) => p.kind).sort()).toEqual(["bill_payment.create", "expense.create", "expense.create", "receipt.create"]);
    expect(waiting.find((p) => p.kind === "receipt.create")).toMatchObject({ targetId: inv.id, title: "Kirkstall Brewing Co paid £1,200 on HS-0007" });

    // Approve them all at once: the invoice is paid, the bill paid, two expenses added.
    const many = await api.post("/proposals/approve-many", { ids: waiting.map((p) => p.id) });
    expect(many.body).toEqual({ approved: 4, failed: [] });
    expect((await t.db.select().from(invoices).where(eq(invoices.id, inv.id)))[0]).toMatchObject({ status: "paid", paid: 120000 });
    expect((await t.db.select().from(bills).where(eq(bills.id, bill.id)))[0]).toMatchObject({ status: "paid", paid: 14400 });
    const after = await api.get(`/statements/${up.body.id}`);
    expect(after.body.lines.map((l: { status: string }) => l.status)).toEqual(["matched", "matched", "matched", "matched", "matched", "unmatched"]);
    expect(after.body.lines[1].href).toBe(`/app/in/invoices/${inv.id}`);
    const tb = await trialBalance(t.db, business.id);
    expect(tb.debit).toBe(tb.credit);

    // The same file again: nothing is proposed twice.
    const again = await upload(token, business.id, "barclays-oct-again.csv", Buffer.from(UK_CSV));
    await drain(t.app);
    const d2 = await api.get(`/statements/${again.body.id}`);
    expect(d2.body.statement.counts).toMatchObject({ ignored: 6, proposed: 0 });
    expect(d2.body.lines[0].note).toBe("Already in an earlier statement");
  });

  it("reads a PDF with the model, and asks the model for the columns of an odd CSV", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "lk");
    models.llm.seen.length = 0;
    models.llm.script.push(
      text(JSON.stringify({ isStatement: true, account: "Commercial Bank ****4471", currency: "LKR", openingBalance: 250000, closingBalance: 235700, lines: [
        { date: "2026-10-05", description: "CHQ PAID COLOMBO PAPER MART", moneyIn: null, moneyOut: 120500, balance: 129500, reference: "004417" },
        { date: "2026-10-14", description: "SLT MOBITEL", moneyIn: null, moneyOut: 11800, balance: 117700, reference: null },
      ] })),
      text(JSON.stringify({ lines: [
        { seq: 1, kind: "business_cost", payee: "Colombo Paper Mart", categoryId: "office", confidence: 85 },
        { seq: 2, kind: "business_cost", payee: "SLT-Mobitel", categoryId: "utilities", confidence: 90 },
      ] })),
    );
    const pdf = await upload(token, business.id, "combank-oct.pdf", Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(40)]));
    await drain(t.app);
    expect(models.llm.seen[0].contents[0].parts![1].inlineData?.mimeType).toBe("application/pdf");
    const d = await api.get(`/statements/${pdf.body.id}`);
    expect(d.body.statement).toMatchObject({ status: "done", format: "pdf", readBy: "model", accountLabel: "Commercial Bank ****4471", openingBalance: 25000000, lineCount: 2 });
    const ps = (await api.get("/proposals")).body.proposals as { payload: { method: string; gross: number } }[];
    expect(ps.map((p) => [p.payload.method, p.payload.gross]).sort()).toEqual([["Bank transfer", 1180000], ["Cheque", 12050000]]);

    // No header the reader knows: the model maps the columns from a sample.
    models.llm.script.push(
      text(JSON.stringify({ headerRow: -1, date: 0, description: [1], amount: 2, debit: null, credit: null, drcr: null, balance: null, reference: null, dateOrder: "dmy", invert: false })),
      text(JSON.stringify({ lines: [{ seq: 1, kind: "business_cost", payee: "Dialog", categoryId: "utilities", confidence: 80 }] })),
    );
    const odd = await upload(token, business.id, "export.csv", Buffer.from("12/10/2026,DIALOG AXIATA,-2500.00\n13/10/2026,INWARD REMITTANCE,5000.00\n"));
    await drain(t.app);
    const d2 = await api.get(`/statements/${odd.body.id}`);
    expect(d2.body.statement).toMatchObject({ status: "done", readBy: "model", lineCount: 2 });
    expect(d2.body.lines[1]).toMatchObject({ amount: 500000, status: "unmatched", note: "Money in that doesn't match an invoice still owed." });
  });

  it("says plainly what it can't use", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk");
    expect((await upload(token, business.id, "photo.png", Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"))).status).toBe(415);
    models.llm.script.push(text(JSON.stringify({ isStatement: true, account: null, currency: "USD", openingBalance: null, closingBalance: null, lines: [] })));
    const up = await upload(token, business.id, "usd.pdf", Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(10)]));
    await drain(t.app);
    expect((await api.get(`/statements/${up.body.id}`)).body.statement).toMatchObject({ status: "failed", error: expect.stringContaining("It's in USD") });
    const other = await signUpWithBusiness(t.app, "uk");
    expect((await other.api.get(`/statements/${up.body.id}`)).status).toBe(404);
    expect((await other.api.get("/statements")).body.statements).toEqual([]);
  });
});

describe("Chaser", () => {
  it("drafts a reminder for a late invoice, checks it, and sends it once approved", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const s = seed(t.db, business.id);
    const c = await s.customer("Ochre Café", { email: "accounts@ochre.example" });
    const inv = await s.invoice({ customerId: c.id, number: "HS-0012", issueDate: "2026-09-01", dueDate: "2026-09-15", total: 60000 });
    // Not due yet: not chased.
    await s.invoice({ customerId: c.id, number: "HS-0013", issueDate: "2026-10-01", dueDate: "2026-10-31", total: 10000 });
    models.llm.seen.length = 0;
    models.llm.script.push(text(JSON.stringify({ reminders: [{ invoice: "HS-0012", message: "Hi Ochre Café,\n\nJust a reminder that invoice HS-0012 for £600 was due on 15 Sept 2026.\n\nThanks,\nHarper Studio" }] })));
    expect((await api.post("/agents/chaser/run", {})).body).toEqual({ queued: true });
    await drain(t.app);
    expect(models.llm.seen[0].contents[0].parts![0].text).toContain('"invoice":"HS-0012"');
    expect(models.llm.seen[0].contents[0].parts![0].text).not.toContain("HS-0013");
    const [p] = (await api.get("/proposals")).body.proposals;
    expect(p).toMatchObject({ agent: "chaser", kind: "invoice.remind", targetId: inv.id, title: "Remind Ochre Café about HS-0012 (£600, 26 days late)", payload: { email: true } });
    expect(p.payload.message).toContain("Just a reminder");

    const ok = await api.post(`/proposals/${p.id}/approve`, {});
    expect(ok.body).toMatchObject({ status: "applied", result: { emailed: true } });
    const [mail] = await t.db.select().from(outboxEmails).where(eq(outboxEmails.businessId, business.id));
    expect(mail).toMatchObject({ toEmail: "accounts@ochre.example", subject: expect.stringContaining("HS-0012") });
    expect(mail.bodyText).toContain("Just a reminder");

    // Reminded today: nothing more to chase.
    expect((await api.post("/agents/chaser/run", {})).body.queued).toBe(true);
    await drain(t.app);
    expect((await api.get("/proposals")).body.pending).toBe(0);
  });

  it("falls back to the plain wording when a draft gets the facts wrong; in Sri Lanka, WhatsApp", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "lk");
    const s = seed(t.db, business.id);
    const c = await s.customer("Kandyan Spice Co");
    await s.invoice({ customerId: c.id, number: "SDS-0004", issueDate: "2026-09-01", dueDate: "2026-09-30", total: 11800000 });
    models.llm.script.push(text(JSON.stringify({ reminders: [{ invoice: "SDS-0004", message: "Please pay [amount] soon." }] })));
    await api.post("/agents/chaser/run", {});
    await drain(t.app);
    const [p] = (await api.get("/proposals")).body.proposals;
    expect(p.payload).toMatchObject({ email: false, message: expect.stringContaining("Rs 118,000.00 is still to pay") });
    expect(p.summary).toContain("WhatsApp");
    const ok = await api.post(`/proposals/${p.id}/approve`, {});
    expect(ok.body.result.whatsappUrl).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it("is scheduled at most once a day per business, only where there's something late", async () => {
    const { business } = await signUpWithBusiness(t.app, "uk");
    const s = seed(t.db, business.id);
    const c = await s.customer("Leeds Lettings", { email: "x@example.com" });
    await s.invoice({ customerId: c.id, number: "HS-0099", issueDate: "2026-08-01", dueDate: "2026-08-15", total: 5000 });
    await t.db.delete(jobs);
    const first = await scanForLate(t.app);
    expect(first).toBeGreaterThanOrEqual(1);
    expect(await scanForLate(t.app)).toBe(0);
    models.llm.script.length = 0;
    await t.db.delete(jobs).where(eq(jobs.queue, "chaser"));
  });
});
