import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

/** A UK sole trader with an invoice issued and paid in Q2, an office expense, an entertaining expense and one to sort. */
async function ukBooks() {
  const s = await signUpWithBusiness(t.app, "uk");
  const { api } = s;
  const c = (await api.post("/customers", { name: "Ochre Café" })).body;
  const inv = (await api.post("/invoices", { customerId: c.id, issueDate: "2026-09-08", lines: [{ description: "Window graphics", quantityMilli: 1000, unitPrice: 45000 }] })).body;
  expect((await api.post(`/invoices/${inv.id}/issue`, { email: false })).status).toBe(200);
  expect((await api.post("/out/expenses", { spentOn: "2026-09-10", payee: "Ryman", categoryId: "office", gross: 2400, method: "Card" })).status).toBe(200);
  expect((await api.post("/out/expenses", { spentOn: "2026-09-12", payee: "The Ivy", categoryId: "entertaining", gross: 6000, method: "Card" })).status).toBe(200);
  expect((await api.post("/out/expenses", { spentOn: "2026-10-08", payee: "Unknown", gross: 1000, method: "Card" })).status).toBe(200);
  return s;
}

describe("profit and loss, balance sheet and categories", () => {
  it("adds up the ledger for the tax year so far", async () => {
    const { api } = await ukBooks();
    const pl = (await api.get("/books/profit-and-loss")).body;
    expect(pl).toMatchObject({ from: "2026-04-06", to: "2026-10-11", totalIncome: 45000, totalExpenses: 9400, profit: 35600, disallowed: 6000 });
    expect(pl.income.map((l: { code: string }) => l.code)).toEqual(["4000"]);
    expect(pl.expenses.find((l: { name: string }) => l.name === "Client entertaining")).toMatchObject({ amount: 6000, allowable: false });

    const bs = (await api.get("/books/balance-sheet?at=2026-10-11")).body;
    expect(bs.totalAssets - bs.totalLiabilities).toBe(bs.totalEquity);
    expect(bs.profitToDate).toBe(35600);
    expect(bs.assets.find((l: { code: string }) => l.code === "1100").amount).toBe(45000);

    const cats = (await api.get("/books/categories?from=2026-09-01&to=2026-09-30")).body;
    expect(cats.categories.find((x: { categoryId: string }) => x.categoryId === "office")).toMatchObject({ amount: 2400, count: 1 });
    expect((await api.get("/books/categories")).body.toSort).toMatchObject({ count: 1, amount: 1000 });
    expect((await api.get("/books/profit-and-loss?from=2026-10-01&to=2026-09-01")).status).toBe(400);
  });
});

describe("MTD quarters", () => {
  it("lists the quarters with figures, checks and state, and marks a quarter as sent", async () => {
    const { api } = await ukBooks();
    const r = (await api.get("/books/quarters")).body;
    expect(r.taxYear).toMatchObject({ label: "2026/27", from: "2026-04-06" });
    expect(r.current).toBe("2026-q3");
    expect(r.quarters.map((q: { state: string }) => q.state)).toEqual(["closed", "closed", "open", "upcoming"]);
    const q2 = r.quarters[1];
    expect(q2).toMatchObject({ label: "Q2 2026/27", due: "2026-11-07", daysToDue: 27 });
    expect(q2.categories.map((c: { name: string }) => c.name)).toEqual(["Phone, internet and office", "Client entertaining"]);
    expect(Object.fromEntries(q2.checks.map((c: { id: string; ok: boolean }) => [c.id, c.ok]))).toEqual({ categories: true, drafts: true, bank: false });
    expect(r.quarters[2].checks.find((c: { id: string }) => c.id === "categories").ok).toBe(false);

    // Can't mark the current quarter, or a made-up period.
    expect((await api.post("/books/locks", { from: "2026-10-06", to: "2027-01-05" })).status).toBe(400);
    expect((await api.post("/books/locks", { from: "2026-07-01", to: "2026-07-31" })).status).toBe(400);
    const lock = await api.post("/books/locks", { from: "2026-07-06", to: "2026-10-05", reference: "MTD-123" });
    expect(lock.status).toBe(200);
    expect(lock.body).toMatchObject({ label: "Q2 2026/27 update", reference: "MTD-123" });
    expect((await api.post("/books/locks", { from: "2026-07-06", to: "2026-10-05" })).status).toBe(409);
    expect((await api.get("/books/quarters")).body.quarters[1]).toMatchObject({ state: "sent", lock: { reference: "MTD-123" } });

    // Nothing more can go into it.
    const late = await api.post("/out/expenses", { spentOn: "2026-09-20", payee: "Ryman", categoryId: "office", gross: 500, method: "Card" });
    expect(late.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(late.body)).toContain("Q2 2026/27");
  });

  it("isn't offered outside the UK", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    expect((await api.get("/books/quarters")).status).toBe(404);
  });
});

describe("VAT and SSCL periods", () => {
  it("lists Sri Lanka's months with output VAT, SSCL and what's payable", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    const c = (await api.post("/customers", { name: "Kandyan Spice Co" })).body;
    const inv = (await api.post("/invoices", { customerId: c.id, issueDate: "2026-09-08", lines: [{ description: "Branding", quantityMilli: 1000, unitPrice: 10000000 }] })).body;
    expect((await api.post(`/invoices/${inv.id}/issue`, { email: false })).status).toBe(200);
    const r = (await api.get("/books/tax-periods")).body;
    expect(r).toMatchObject({ vat: true, sscl: true, current: "2026-10" });
    expect(r.periods).toHaveLength(12);
    const sep = r.periods.find((p: { id: string }) => p.id === "2026-09");
    expect(sep).toMatchObject({ state: "closed", due: "2026-10-20", sales: 10000000, sscl: 250000 });
    expect(sep.outputVat).toBeGreaterThan(0);
    expect(sep.vatPayable).toBe(sep.outputVat - sep.inputVat);
    const lock = await api.post("/books/locks", { from: "2026-09-01", to: "2026-09-30" });
    expect(lock.body.label).toBe("September 2026 VAT and SSCL return");
  });

  it("gives a UK VAT-registered business its VAT quarters, and none for the US", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk", { vatRegistered: true, vatNumber: "GB123456789" });
    const r = (await api.get("/books/tax-periods")).body;
    expect(r.periods.map((p: { label: string }) => p.label)).toEqual(["Apr – Jun 2026", "Jul – Sep 2026", "Oct – Dec 2026", "Jan – Mar 2027"]);
    const us = await signUpWithBusiness(t.app, "us");
    expect((await us.api.get("/books/tax-periods")).status).toBe(404);
  });
});

describe("tax year end", () => {
  it("has the year's profit, estimate, payments and checks", async () => {
    const { api } = await ukBooks();
    const r = (await api.get("/books/year-end")).body;
    expect(r.taxYear).toMatchObject({ label: "2026/27", to: "2027-04-05" });
    expect(r.daysToEnd).toBe(176);
    expect(r.profitAndLoss.profit).toBe(35600);
    expect(r.estimate.label).toBe("Income Tax and NI");
    expect(r.checks.map((c: { id: string }) => c.id)).toEqual(["categories", "drafts", "bank"]);
    expect(r.lock).toBeNull();
  });
});
