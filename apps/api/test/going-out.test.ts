import { accountTotals, trialBalance } from "@billingease/db";
import { journalEntries, lockedPeriods } from "@billingease/db/schema";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpWithBusiness, testApp } from "./helpers";

process.env.BILLINGEASE_TODAY = "2026-10-11";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

const balanced = async (businessId: string) => {
  const tb = await trialBalance(t.db, businessId);
  expect(tb.debit).toBe(tb.credit);
  return tb;
};

/** Debit minus credit on one account, over all time. */
async function balance(businessId: string, code: string) {
  const rows = await accountTotals(t.db, businessId, "2000-01-01", "2100-01-01");
  const r = rows.find((x) => x.code === code);
  return r ? r.debit - r.credit : 0;
}

function multipart(fields: Record<string, string>, file?: { name: string; type: string; bytes: Buffer }) {
  const boundary = "----betest" + Math.random().toString(16).slice(2);
  const parts: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  if (file) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`));
    parts.push(file.bytes, Buffer.from("\r\n"));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { payload: Buffer.concat(parts), headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}

async function upload(token: string, businessId: string, fields: Record<string, string>, file?: { name: string; type: string; bytes: Buffer }) {
  const m = multipart(fields, file);
  const res = await t.app.inject({ method: "POST", url: "/out/attachments", payload: m.payload, headers: { ...m.headers, authorization: `Bearer ${token}`, "x-business-id": businessId } });
  return { status: res.statusCode, body: res.json() };
}

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

describe("categories", () => {
  it("UK sole trader gets business categories; landlords also get property ones", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const r = await api.get("/out/categories");
    expect(r.status).toBe(200);
    expect(r.body.categories.every((c: { scope: string }) => c.scope === "business")).toBe(true);
    expect(r.body.payMethods).toContain("Cheque");
    expect(r.body.businessUse).toBe(true);
    const landlord = await signUpWithBusiness(t.app, "uk", { kind: "both" });
    const l = await landlord.api.get("/out/categories");
    expect(l.body.hasProperty).toBe(true);
    expect(l.body.categories.some((c: { scope: string }) => c.scope === "property")).toBe(true);
    const lk = await signUpWithBusiness(t.app, "lk");
    const k = await lk.api.get("/out/categories");
    expect(k.body.businessUse).toBe(false);
    expect(k.body.vatRegistered).toBe(true);
    expect(k.body.categories.find((c: { id: string }) => c.id === "capital").capital).toBe(true);
  });
});

describe("expenses", () => {
  it("UK: 50% business use posts half to the category and half to drawings", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const r = await api.post("/out/expenses", { spentOn: "2026-10-09", payee: "EE", categoryId: "office", gross: 3200, bizPct: 50, method: "Card" });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ businessShare: 1600, bizPct: 50, vat: 0, categoryName: "Phone, internet and office" });
    await balanced(business.id);
    expect(await balance(business.id, "6060")).toBe(1600);
    expect(await balance(business.id, "3100")).toBe(1600);
    expect(await balance(business.id, "2050")).toBe(-3200);
  });

  it("UK not VAT registered: refuses VAT on a receipt; checks the method and business use", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const v = await api.post("/out/expenses", { spentOn: "2026-10-09", payee: "EE", categoryId: "office", gross: 3200, vat: 500, method: "Card" });
    expect(v.status).toBe(400);
    expect(v.body.error.fields.vat).toBeTruthy();
    expect((await api.post("/out/expenses", { spentOn: "2026-10-09", payee: "EE", gross: 3200, method: "Bitcoin" })).body.error.fields.method).toBeTruthy();
    expect((await api.post("/out/expenses", { spentOn: "2026-10-09", payee: "EE", gross: 3200, method: "Card", bizPct: 0 })).body.error.fields.bizPct).toBeTruthy();
    expect((await api.post("/out/expenses", { spentOn: "2026-10-09", gross: 3200, method: "Card" })).body.error.fields.payee).toBeTruthy();
    expect((await api.post("/out/expenses", { spentOn: "2026-10-09", payee: "X", categoryId: "p-repairs", gross: 3200, method: "Card" })).status).toBe(400);
  });

  it("Sri Lanka: a cheque with input VAT on a VAT-registered business", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "lk");
    const bad = await api.post("/out/expenses", { spentOn: "2026-10-05", payee: "Colombo Print House", categoryId: "cogs", gross: 118000_00, vat: 118000_00, method: "Cheque", chequeNumber: "004512" });
    expect(bad.status).toBe(400);
    expect((await api.post("/out/expenses", { spentOn: "2026-10-05", payee: "Colombo Print House", categoryId: "cogs", gross: 118000_00, vat: 18000_00, method: "Cheque" })).body.error.fields.chequeNumber).toBeTruthy();
    const r = await api.post("/out/expenses", {
      spentOn: "2026-10-05", payee: "Colombo Print House", categoryId: "cogs", gross: 118000_00, vat: 18000_00, bizPct: 50,
      method: "Cheque", chequeNumber: "004512", chequeBank: "Commercial Bank",
    });
    expect(r.status).toBe(200);
    // Business use doesn't apply in Sri Lanka.
    expect(r.body).toMatchObject({ bizPct: 100, vat: 18000_00, chequeNumber: "004512", chequeDate: "2026-10-05", chequeBank: "Commercial Bank" });
    await balanced(business.id);
    expect(await balance(business.id, "6000")).toBe(100000_00);
    expect(await balance(business.id, "1200")).toBe(18000_00);
    expect(await balance(business.id, "1000")).toBe(-118000_00);
  });

  it("sort later posts to Spending to sort, and categorising moves it", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const r = await api.post("/out/expenses", { spentOn: "2026-10-03", payee: "Amazon", gross: 6420, method: "Card" });
    expect(r.body.categoryId).toBeNull();
    expect(await balance(business.id, "6990")).toBe(6420);
    const list = await api.get("/out/expenses?uncategorised=true");
    expect(list.body.totals.count).toBe(1);
    expect((await api.get("/out/summary")).body.needs.uncategorised).toBe(1);
    const c = await api.post(`/out/expenses/${r.body.id}/categorise`, { categoryId: "office" });
    expect(c.body.categoryId).toBe("office");
    expect(await balance(business.id, "6990")).toBe(0);
    expect(await balance(business.id, "6060")).toBe(6420);
    await balanced(business.id);
  });

  it("an edit reverses the old entry and posts a new one; a delete reverses it", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const r = await api.post("/out/expenses", { spentOn: "2026-10-01", payee: "LNER", categoryId: "travel", gross: 8000, method: "Card" });
    const e = await api.patch(`/out/expenses/${r.body.id}`, { spentOn: "2026-10-02", payee: "LNER", categoryId: "travel", gross: 9000, bizPct: 100, method: "Bank transfer", note: "Leeds to York" });
    expect(e.status).toBe(200);
    expect(e.body).toMatchObject({ gross: 9000, method: "Bank transfer", spentOn: "2026-10-02" });
    const entries = await t.db.select().from(journalEntries).where(and(eq(journalEntries.businessId, business.id), eq(journalEntries.sourceType, "expense")));
    expect(entries).toHaveLength(3); // original, its reversal, the new one
    expect(entries.filter((x) => x.reversesEntryId)).toHaveLength(1);
    expect(entries.filter((x) => x.reversedAt)).toHaveLength(1);
    expect(await balance(business.id, "6030")).toBe(9000);
    expect(await balance(business.id, "2050")).toBe(0);
    expect(await balance(business.id, "1000")).toBe(-9000);
    await balanced(business.id);
    expect((await api.del(`/out/expenses/${r.body.id}`)).status).toBe(200);
    expect(await balance(business.id, "6030")).toBe(0);
    expect(await balance(business.id, "1000")).toBe(0);
    expect((await api.get(`/out/expenses/${r.body.id}`)).status).toBe(404);
    await balanced(business.id);
  });

  it("can't post into a filed (locked) period", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const before = await api.post("/out/expenses", { spentOn: "2026-06-10", payee: "Hiscox", categoryId: "premises", gross: 18600, method: "Card" });
    await t.db.insert(lockedPeriods).values({ businessId: business.id, fromDate: "2026-04-06", toDate: "2026-07-05", label: "Q1 2026/27" });
    const r = await api.post("/out/expenses", { spentOn: "2026-06-12", payee: "Hiscox", categoryId: "premises", gross: 1000, method: "Card" });
    expect(r.status).toBe(409);
    expect(r.body.error.message).toMatch(/Q1 2026\/27 is filed and locked/);
    // Editing or deleting an expense inside the locked period is refused too, and nothing changes.
    const tbBefore = await trialBalance(t.db, business.id);
    expect((await api.patch(`/out/expenses/${before.body.id}`, { spentOn: "2026-10-01", payee: "Hiscox", categoryId: "premises", gross: 20000, method: "Card" })).status).toBe(409);
    expect((await api.del(`/out/expenses/${before.body.id}`)).status).toBe(409);
    expect(await trialBalance(t.db, business.id)).toEqual(tbBefore);
    expect((await api.get(`/out/expenses/${before.body.id}`)).body.expense.gross).toBe(18600);
    expect((await api.get("/out/expenses")).body.expenses).toHaveLength(1);
    // After the period, fine.
    expect((await api.post("/out/expenses", { spentOn: "2026-07-06", payee: "Hiscox", categoryId: "premises", gross: 1000, method: "Card" })).status).toBe(200);
  });

  it("filters by period, category and supplier", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const s = await api.post("/out/suppliers", { name: "Royal Mail" });
    await api.post("/out/expenses", { spentOn: "2026-09-09", payee: "royal mail", categoryId: "office", gross: 1260, method: "Cash" });
    await api.post("/out/expenses", { spentOn: "2026-10-09", supplierId: s.body.id, categoryId: "office", gross: 1000, method: "Cash" });
    await api.post("/out/expenses", { spentOn: "2026-10-10", payee: "LNER", categoryId: "travel", gross: 5000, method: "Card" });
    expect((await api.get("/out/expenses?from=2026-10-01&to=2026-10-31")).body.totals).toMatchObject({ count: 2, gross: 6000 });
    expect((await api.get("/out/expenses?category=office")).body.totals.count).toBe(2);
    // Typing an existing supplier's name links the expense to them.
    expect((await api.get(`/out/expenses?supplierId=${s.body.id}`)).body.totals.count).toBe(2);
  });
});

describe("bills", () => {
  it("a bill with two lines, paid part by cheque then the rest", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "lk");
    const r = await api.post("/out/bills", {
      supplierName: "Studio Furnish (Pvt) Ltd", reference: "SF-1180", billDate: "2026-10-02", dueDate: "2026-10-16",
      lines: [
        { description: "Two designer desks", categoryId: "capital", net: 200000_00, vat: 36000_00 },
        { description: "Delivery", categoryId: "other", net: 5000_00, vat: 900_00 },
      ],
    });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ total: 241900_00, net: 205000_00, vat: 36900_00, status: "unpaid", due: "due_soon" });
    expect(await balance(business.id, "2000")).toBe(-241900_00);
    expect(await balance(business.id, "1200")).toBe(36900_00);
    await balanced(business.id);
    // The supplier was created by name.
    const sups = await api.get("/out/suppliers");
    expect(sups.body.suppliers.map((s: { name: string }) => s.name)).toContain("Studio Furnish (Pvt) Ltd");

    expect((await api.post(`/out/bills/${r.body.id}/payments`, { amount: 300000_00, paidOn: "2026-10-05", method: "Bank transfer" })).status).toBe(400);
    expect((await api.post(`/out/bills/${r.body.id}/payments`, { amount: 100000_00, paidOn: "2026-10-05", method: "Cheque" })).body.error.fields.chequeNumber).toBeTruthy();
    const p1 = await api.post(`/out/bills/${r.body.id}/payments`, { amount: 100000_00, paidOn: "2026-10-05", method: "Cheque", chequeNumber: "000731", chequeBank: "Sampath Bank" });
    expect(p1.body).toMatchObject({ status: "part_paid", paid: 100000_00, left: 141900_00 });
    expect((await api.post(`/out/bills/${r.body.id}/void`)).status).toBe(409);
    const p2 = await api.post(`/out/bills/${r.body.id}/payments`, { amount: 141900_00, paidOn: "2026-10-10", method: "Bank transfer" });
    expect(p2.body).toMatchObject({ status: "paid", left: 0, due: "paid" });
    expect(await balance(business.id, "2000")).toBe(0);
    expect(await balance(business.id, "1000")).toBe(-241900_00);
    await balanced(business.id);
    const d = await api.get(`/out/bills/${r.body.id}`);
    expect(d.body.lines).toHaveLength(2);
    expect(d.body.payments).toHaveLength(2);
    expect(d.body.payments[0]).toMatchObject({ chequeNumber: "000731", chequeBank: "Sampath Bank" });
    expect(d.body.history.map((h: { text: string }) => h.text).join(" | ")).toMatch(/by cheque 000731/);
    const sum = await api.get("/out/summary?period=month");
    expect(sum.body.paid).toBe(241900_00);
  });

  it("voids an unpaid bill with a reversal; lists due soon and overdue", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const sup = await api.post("/out/suppliers", { name: "Footprint Print", vatNumber: "GB123456789" });
    expect(sup.body.vatNumber).toBe("GB123456789");
    const a = await api.post("/out/bills", { supplierId: sup.body.id, billDate: "2026-10-02", dueDate: "2026-10-16", lines: [{ description: "Posters", categoryId: "advertising", net: 42000 }] });
    const late = await api.post("/out/bills", { supplierName: "footprint print", billDate: "2026-09-01", dueDate: "2026-10-01", lines: [{ description: "Flyers", categoryId: "advertising", net: 9000 }] });
    expect(late.body.supplierId).toBe(sup.body.id);
    expect(late.body.due).toBe("overdue");
    expect(a.body.due).toBe("due_soon");
    expect((await api.get("/out/bills?due=soon")).body.bills).toHaveLength(1);
    expect((await api.get("/out/bills?due=overdue")).body.bills).toHaveLength(1);
    const s = await api.get("/out/summary");
    expect(s.body.needs).toMatchObject({ dueSoonBills: 1, overdueBills: 1 });
    expect((await api.post("/out/bills", { supplierName: "X", billDate: "2026-10-02", dueDate: "2026-10-16", lines: [{ description: "Y", categoryId: "other", net: 100, vat: 20 }] })).status).toBe(400);
    expect((await api.post("/out/bills", { supplierName: "X", billDate: "2026-10-02", dueDate: "2026-09-16", lines: [{ description: "Y", categoryId: "other", net: 100 }] })).body.error.fields.dueDate).toBeTruthy();
    const v = await api.post(`/out/bills/${a.body.id}/void`);
    expect(v.body.status).toBe("void");
    expect(await balance(business.id, "2000")).toBe(-9000);
    await balanced(business.id);
    expect((await api.post(`/out/bills/${a.body.id}/payments`, { amount: 100, paidOn: "2026-10-10", method: "Card" })).status).toBe(409);
    // A supplier with open bills can't be archived.
    expect((await api.post(`/out/suppliers/${sup.body.id}/archive`, { archived: true })).status).toBe(409);
  });
});

describe("every-month costs", () => {
  it("records this month's payment from the template", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const sup = await api.post("/out/suppliers", { name: "Northern Desk Co-working" });
    const c = await api.post("/out/monthly", { name: "Desk", supplierId: sup.body.id, categoryId: "premises", amount: 18000, method: "Direct debit", dayOfMonth: 1 });
    expect(c.status).toBe(200);
    expect(c.body).toMatchObject({ state: "late", dueOn: "2026-10-01" });
    const later = await api.post("/out/monthly", { name: "Krystal hosting", categoryId: "office", amount: 1200, method: "Card", dayOfMonth: 28 });
    expect(later.body.state).toBe("due");
    expect((await api.post("/out/monthly", { name: "X", categoryId: "office", amount: 1200, method: "Card", dayOfMonth: 31 })).status).toBe(400);
    const e = await api.post(`/out/monthly/${c.body.id}/record`, { spentOn: "2026-10-01" });
    expect(e.status).toBe(200);
    expect(e.body).toMatchObject({ monthlyCostId: c.body.id, gross: 18000, payee: "Northern Desk Co-working", categoryId: "premises" });
    expect((await api.post(`/out/monthly/${c.body.id}/record`, { spentOn: "2026-10-03" })).status).toBe(409);
    const list = await api.get("/out/monthly");
    const desk = list.body.costs.find((x: { id: string }) => x.id === c.body.id);
    expect(desk).toMatchObject({ state: "recorded", recordedOn: "2026-10-01", nextOn: "2026-11-01" });
    expect(list.body.totals).toMatchObject({ perMonth: 19200, recorded: 18000, toPay: 1200 });
    const p = await api.post(`/out/monthly/${later.body.id}/pause`, { active: false });
    expect(p.body.state).toBe("paused");
    expect((await api.get("/out/monthly")).body.totals.toPay).toBe(0);
    const supplier = await api.get(`/out/suppliers/${sup.body.id}`);
    expect(supplier.body.expenses).toHaveLength(1);
    expect(supplier.body.monthlyCosts).toHaveLength(1);
    expect(supplier.body.supplier.paidThisYear).toBe(18000);
    expect((await api.del(`/out/monthly/${later.body.id}`)).status).toBe(200);
    await balanced(business.id);
  });
});

describe("attachments and tenancy", () => {
  it("stores a PDF, lists it and downloads it; refuses other files", async () => {
    const { api, token, business } = await signUpWithBusiness(t.app, "uk");
    const e = await api.post("/out/expenses", { spentOn: "2026-10-09", payee: "Royal Mail", categoryId: "office", gross: 1260, method: "Cash" });
    const up = await upload(token, business.id, { ownerType: "expense", ownerId: e.body.id }, { name: "receipt.pdf", type: "application/pdf", bytes: PDF });
    expect(up.status).toBe(200);
    expect(up.body).toMatchObject({ filename: "receipt.pdf", mime: "application/pdf", size: PDF.length });
    const html = await upload(token, business.id, { ownerType: "expense", ownerId: e.body.id }, { name: "x.pdf", type: "application/pdf", bytes: Buffer.from("<html><script>alert(1)</script>") });
    expect(html.status).toBe(415);
    const big = await upload(token, business.id, { ownerType: "expense", ownerId: e.body.id }, { name: "big.pdf", type: "application/pdf", bytes: Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]) });
    expect(big.status).toBe(413);
    expect((await api.get(`/out/attachments?ownerType=expense&ownerId=${e.body.id}`)).body.attachments).toHaveLength(1);
    expect((await api.get(`/out/expenses/${e.body.id}`)).body.expense.attachmentCount).toBe(1);
    const res = await t.app.inject({ method: "GET", url: `/out/attachments/${up.body.id}/file?download=1`, headers: { authorization: `Bearer ${token}`, "x-business-id": business.id } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toMatch(/^attachment; filename="receipt.pdf"/);
    expect(Buffer.compare(res.rawPayload, PDF)).toBe(0);
    expect((await api.del(`/out/attachments/${up.body.id}`)).status).toBe(200);
    expect((await api.get(`/out/attachments?ownerType=expense&ownerId=${e.body.id}`)).body.attachments).toHaveLength(0);
  });

  it("business B can't see or touch business A's going out", async () => {
    const A = await signUpWithBusiness(t.app, "uk");
    const B = await signUpWithBusiness(t.app, "lk");
    const e = await A.api.post("/out/expenses", { spentOn: "2026-10-09", payee: "Royal Mail", categoryId: "office", gross: 1260, method: "Cash" });
    const bill = await A.api.post("/out/bills", { supplierName: "Footprint", billDate: "2026-10-02", dueDate: "2026-10-16", lines: [{ description: "Posters", categoryId: "advertising", net: 42000 }] });
    const cost = await A.api.post("/out/monthly", { name: "Desk", categoryId: "premises", amount: 18000, method: "Card", dayOfMonth: 1 });
    const file = await upload(A.token, A.business.id, { ownerType: "bill", ownerId: bill.body.id }, { name: "bill.pdf", type: "application/pdf", bytes: PDF });
    expect(file.status).toBe(200);

    // B can't attach to A's bill, list its files, download or delete them.
    expect((await upload(B.token, B.business.id, { ownerType: "bill", ownerId: bill.body.id }, { name: "x.pdf", type: "application/pdf", bytes: PDF })).status).toBe(404);
    expect((await B.api.get(`/out/attachments?ownerType=bill&ownerId=${bill.body.id}`)).status).toBe(404);
    const dl = await t.app.inject({ method: "GET", url: `/out/attachments/${file.body.id}/file`, headers: { authorization: `Bearer ${B.token}`, "x-business-id": B.business.id } });
    expect(dl.statusCode).toBe(404);
    expect((await B.api.del(`/out/attachments/${file.body.id}`)).status).toBe(404);
    // Nor pretend to be A by naming A's business.
    expect((await t.app.inject({ method: "GET", url: `/out/attachments/${file.body.id}/file`, headers: { authorization: `Bearer ${B.token}`, "x-business-id": A.business.id } })).statusCode).toBe(403);

    expect((await B.api.get(`/out/expenses/${e.body.id}`)).status).toBe(404);
    expect((await B.api.patch(`/out/expenses/${e.body.id}`, { spentOn: "2026-10-09", payee: "x", gross: 100, method: "Cash" })).status).toBe(404);
    expect((await B.api.del(`/out/expenses/${e.body.id}`)).status).toBe(404);
    expect((await B.api.get(`/out/bills/${bill.body.id}`)).status).toBe(404);
    expect((await B.api.post(`/out/bills/${bill.body.id}/payments`, { amount: 100, paidOn: "2026-10-10", method: "Cash" })).status).toBe(404);
    expect((await B.api.post(`/out/monthly/${cost.body.id}/record`, { spentOn: "2026-10-01" })).status).toBe(404);
    expect((await B.api.get(`/out/suppliers/${bill.body.supplierId}`)).status).toBe(404);
    expect((await B.api.post("/out/expenses", { spentOn: "2026-10-09", supplierId: bill.body.supplierId, gross: 100, method: "Cash" })).status).toBe(404);
    expect((await B.api.get("/out/expenses")).body.expenses).toHaveLength(0);
    expect((await B.api.get("/out/suppliers")).body.suppliers).toHaveLength(0);
    expect((await t.app.inject({ method: "GET", url: `/out/attachments/${file.body.id}/file`, headers: { authorization: `Bearer ${A.token}`, "x-business-id": A.business.id } })).statusCode).toBe(200);
  });
});
