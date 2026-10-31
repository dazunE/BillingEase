import { accountTotals, trialBalance } from "@billingease/db";
import { fxRates } from "@billingease/db/schema";
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { RateSource } from "../src/services/fx";
import { signUpWithBusiness, testApp } from "./helpers";

/**
 * Documents in a currency other than the business's: they keep their own amounts, and the books
 * get the home-currency value at the document's rate. Payments at a different rate leave an
 * exchange rate gain or loss in 4800.
 */

// USD is worth 0.79 GBP until 10 Oct 2026, then 0.80. No rate at all for JPY.
const rates: RateSource = async (base, quote, day) => {
  const t: Record<string, number> = { "USD/GBP": day >= "2026-10-10" ? 0.8 : 0.79, "EUR/GBP": 0.86, "USD/LKR": 300 };
  return t[`${base}/${quote}`] ?? null;
};

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp({ rates }); });
afterAll(() => t.close());

async function balances(businessId: string) {
  const rows = await accountTotals(t.db, businessId, "2000-01-01", "2100-12-31");
  return Object.fromEntries(rows.map((r) => [r.code, r.debit - r.credit])) as Record<string, number>;
}
async function balanced(businessId: string) {
  const tb = await trialBalance(t.db, businessId);
  expect(tb.debit).toBe(tb.credit);
}

describe("exchange rates", () => {
  it("looks up the rate to the home currency, and caches it", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const r = await api.get("/fx/rate?from=USD&on=2026-10-08");
    expect(r.body).toEqual({ from: "USD", to: "GBP", rate: "0.79", day: "2026-10-08", label: "1 USD = 0.79 GBP" });
    expect((await t.db.select().from(fxRates)).some((x) => x.base === "USD" && x.quote === "GBP" && x.day === "2026-10-08")).toBe(true);
    expect((await api.get("/fx/rate?from=JPY&on=2026-10-08")).body).toMatchObject({ rate: null, label: null });
    expect((await api.get("/fx/rate?from=XYZ")).status).toBe(400);
  });
});

describe("invoices in a client's currency", () => {
  it("books a USD invoice in pounds and the payments' exchange difference in 4800", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk");
    const c = (await api.post("/customers", { name: "Brightline Inc", email: "ap@brightline.com", currency: "USD" })).body;
    expect(c.currency).toBe("USD");

    // The customer's currency is the default; the rate on the issue date is looked up.
    const draft = (await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-08", lines: [{ description: "Product design sprint", quantityMilli: 1000, unitPrice: 100000 }] })).body;
    expect(draft).toMatchObject({ currency: "USD", fxRate: "0.79", total: 100000, homeTotal: 79000 });
    const sent = await api.post(`/invoices/${draft.id}/issue`, { email: true });
    expect(sent.status).toBe(200);
    expect(t.sent.at(-1)!.text).toContain("US$1,000.00");
    let bal = await balances(business.id);
    expect(bal["1100"]).toBe(79000);
    expect(bal["4000"]).toBe(-79000);

    // The PDF is in dollars, with the pounds underneath.
    const pdf = await t.app.inject({ method: "GET", url: `/invoices/${draft.id}/pdf`, headers: { authorization: `Bearer ${token}`, "x-business-id": business.id } });
    expect(pdf.statusCode).toBe(200);
    expect((await PDFDocument.load(pdf.rawPayload)).getPageCount()).toBe(1);

    // $400 arrives on 10 Oct at 0.80: £320 in the bank, clearing £316 of the invoice: a £4 gain.
    const part = await api.post(`/invoices/${draft.id}/payments`, { amount: 40000, receivedOn: "2026-10-10", method: "Bank transfer" });
    expect(part.status).toBe(200);
    expect(part.body).toMatchObject({ status: "part_paid", open: 60000, homeOpen: 47400 });
    expect(part.body.receipts[0]).toMatchObject({ amount: 40000, homeAmount: 32000, fxGain: 400 });
    bal = await balances(business.id);
    expect(bal["1000"]).toBe(32000);
    expect(bal["1100"]).toBe(47400);
    expect(bal["4800"]).toBe(-400);

    // The other $600 brings £470 after fees: it clears the last £474, a £4 loss.
    const rest = await api.post(`/invoices/${draft.id}/payments`, { amount: 60000, homeAmount: 47000, receivedOn: "2026-10-11", method: "Bank transfer" });
    expect(rest.body).toMatchObject({ status: "paid", open: 0, homeOpen: 0 });
    bal = await balances(business.id);
    expect(bal["1100"] ?? 0).toBe(0);
    expect(bal["4800"] ?? 0).toBe(0);
    expect(bal["1000"]).toBe(79000);
    await balanced(business.id);

    // Lists and customers add up in pounds.
    const list = (await api.get("/invoices")).body;
    expect(list.totals).toMatchObject({ total: 79000, open: 0, paid: 79000 });
    const cust = (await api.get(`/customers/${c.id}`)).body;
    expect(cust.customer).toMatchObject({ owed: 0, paid: 79000 });

    // Removing a payment puts its share back on the invoice.
    await api.post(`/invoices/${draft.id}/payments/${rest.body.receipts[1].id}/void`, {});
    bal = await balances(business.id);
    expect(bal["1100"]).toBe(47400);
    await balanced(business.id);
  });

  it("credits a EUR invoice at its own rate, clearing exactly what it added", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk", { vatRegistered: true, vatNumber: "GB123456789" });
    const c = (await api.post("/customers", { name: "Atelier Nord" })).body;
    const inv = (await api.post("/invoices", {
      customerId: c.id, issueDate: "2026-10-08", currency: "EUR", fxRate: "0.8612",
      lines: [{ description: "Illustrations", quantityMilli: 3000, unitPrice: 11111, vatRateId: "std" }],
    })).body;
    expect(inv).toMatchObject({ currency: "EUR", fxRate: "0.8612", net: 33333, vat: 6667, total: 40000 });
    expect(inv).toMatchObject({ homeNet: 28706, homeVat: 5742, homeTotal: 34448 });
    await api.post(`/invoices/${inv.id}/issue`, {});
    expect((await balances(business.id))["2200"]).toBe(-5742);
    const cn = await api.post(`/invoices/${inv.id}/credit-notes`, { full: true });
    expect(cn.status).toBe(200);
    expect(cn.body).toMatchObject({ kind: "credit_note", currency: "EUR", total: 40000 });
    const bal = await balances(business.id);
    expect(bal["1100"] ?? 0).toBe(0);
    expect(bal["4000"] ?? 0).toBe(0);
    expect(bal["2200"] ?? 0).toBe(0);
    await balanced(business.id);
  });

  it("asks for the rate when none can be found, and handles currencies without decimals", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const c = (await api.post("/customers", { name: "Kumo KK" })).body;
    const body = { customerId: c.id, issueDate: "2026-10-08", currency: "JPY", lines: [{ description: "Licence", quantityMilli: 1000, unitPrice: 120000 }] };
    const miss = await api.post("/invoices", body);
    expect(miss.status).toBe(400);
    expect(miss.body.error.fields).toHaveProperty("fxRate");
    const ok = await api.post("/invoices", { ...body, fxRate: "0.0052" });
    // ¥120,000 at 0.0052 is £624.00
    expect(ok.body).toMatchObject({ currency: "JPY", total: 120000, homeTotal: 62400 });
    expect((await api.post("/invoices", { ...body, fxRate: "-1" })).status).toBe(400);
    await api.post(`/invoices/${ok.body.id}/issue`, {});
    expect((await balances(business.id))["1100"]).toBe(62400);
  });

  it("keeps the home currency exactly as before", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const c = (await api.post("/customers", { name: "Ochre Café" })).body;
    const inv = (await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-08", lines: [{ description: "Menu", quantityMilli: 1000, unitPrice: 45000 }] })).body;
    expect(inv).toMatchObject({ currency: "GBP", fxRate: "1", total: 45000, homeTotal: 45000 });
    await api.post(`/invoices/${inv.id}/issue`, {});
    const paid = (await api.post(`/invoices/${inv.id}/payments`, { amount: 45000, receivedOn: "2026-10-09", method: "Bank transfer" })).body;
    expect(paid.receipts[0]).toMatchObject({ amount: 45000, homeAmount: 45000, fxGain: 0 });
  });

  it("turns a USD quote into an invoice at the rate on the invoice's date", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const c = (await api.post("/customers", { name: "Brightline Inc", currency: "USD" })).body;
    const q = (await api.post("/quotes", { customerId: c.id, issueDate: "2026-10-08", lines: [{ description: "Sprint", quantityMilli: 1000, unitPrice: 100000 }] })).body;
    expect(q).toMatchObject({ currency: "USD", fxRate: "0.79", homeTotal: 79000 });
    const conv = await api.post(`/quotes/${q.id}/convert`, {});
    const inv = (await api.get(`/invoices/${conv.body.invoiceId}`)).body;
    expect(inv).toMatchObject({ currency: "USD", fxRate: "0.8", total: 100000, homeTotal: 80000 });
  });

  it("makes repeating invoices in their currency", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    const c = (await api.post("/customers", { name: "Harbor Labs", currency: "USD" })).body;
    const r = await api.post("/recurring", {
      customerId: c.id, name: "Retainer", frequency: "monthly", nextRun: "2026-12-01", termsDays: 14,
      lines: [{ description: "Retainer", quantityMilli: 1000, unitPrice: 50000 }],
    });
    expect(r.status).toBe(200);
    expect(r.body.currency).toBe("USD");
    const run = await api.post(`/recurring/${r.body.id}/run`, {});
    const inv = (await api.get(`/invoices/${run.body.invoiceId}`)).body;
    // Sri Lanka: SSCL and VAT apply to the dollar amounts; the books get rupees at 300.
    expect(inv.currency).toBe("USD");
    expect(inv.homeTotal).toBe(inv.total * 300);
  });
});

describe("bills and expenses in a supplier's currency", () => {
  it("books a USD bill in pounds and the payment's difference as a loss", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const s = (await api.post("/out/suppliers", { name: "Figma", currency: "USD" })).body;
    expect(s.currency).toBe("USD");
    const bill = await api.post("/out/bills", { supplierId: s.id, billDate: "2026-10-08", dueDate: "2026-10-22", lines: [{ description: "Seats", categoryId: "office", net: 45000 }] });
    expect(bill.status).toBe(200);
    expect(bill.body).toMatchObject({ currency: "USD", fxRate: "0.79", total: 45000, homeTotal: 35550, homeLeft: 35550 });
    // Paid on 10 Oct: $450 at 0.80 = £360 out of the bank, against £355.50 owed: a £4.50 loss.
    const paid = await api.post(`/out/bills/${bill.body.id}/payments`, { amount: 45000, paidOn: "2026-10-10", method: "Bank transfer" });
    expect(paid.status).toBe(200);
    expect(paid.body).toMatchObject({ status: "paid", left: 0, homeLeft: 0 });
    const bal = await balances(business.id);
    expect(bal["2000"] ?? 0).toBe(0);
    expect(bal["1000"]).toBe(-36000);
    expect(bal["4800"]).toBe(450);
    await balanced(business.id);
    const detail = (await api.get(`/out/bills/${bill.body.id}`)).body;
    expect(detail.payments[0]).toMatchObject({ amount: 45000, homeAmount: 36000, fxGain: -450 });
    expect((await api.get(`/out/suppliers/${s.id}`)).body.supplier).toMatchObject({ owed: 0, paidThisYear: 36000 });
  });

  it("keeps an expense at what left the account, with the receipt's own amount alongside", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const e = await api.post("/out/expenses", { spentOn: "2026-10-08", payee: "Hotel Lumière", categoryId: "travel", gross: 12000, currency: "EUR", homeGross: 10450, method: "Card" });
    expect(e.status).toBe(200);
    expect(e.body).toMatchObject({ gross: 10450, currency: "EUR", originalGross: 12000 });
    expect(Number(e.body.fxRate)).toBeCloseTo(0.8708, 4);
    // Without the amount from the bank, the day's rate is used: €50 at 0.86 = £43.
    const e2 = (await api.post("/out/expenses", { spentOn: "2026-10-08", payee: "Taxi", categoryId: "travel", gross: 5000, currency: "EUR", method: "Card" })).body;
    expect(e2).toMatchObject({ gross: 4300, fxRate: "0.86" });
    const bal = await balances(business.id);
    expect(bal["2050"]).toBe(-(10450 + 4300));
    await balanced(business.id);
  });
});
