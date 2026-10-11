import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests, type Db } from "@/db/client";
import { bankFeeds, bankTransactions, businesses, users } from "@/db/schema";
import { accountByCode, accountBySubtype, createDefaultAccounts, postEntry, trialBalance } from "@/lib/ledger";
import { threeNumbers } from "@/lib/numbers";
import { createBill, createCustomer, createInvoice, OpError, recordExpense, recordPayment, sendInvoice } from "@/lib/ops";
import {
  balanceSheet,
  ledgerPage,
  monthlyKeepSeries,
  reportRange,
  safeToSpend,
  searchBusiness,
  shiftMonth,
  taxEstimate,
  updateBusinessSettings,
} from "@/lib/ops-keep";
import { seedSampleData } from "@/lib/sample";

const T = "2026-10-04";
const send = { appUrl: "http://localhost:3000", businessName: "Northwind Studio" };
let db: Db;
let businessId: string;

beforeEach(async () => {
  db = await resetDbForTests();
  const [u] = await db.insert(users).values({ email: "maya@example.com", name: "Maya", passwordHash: "x" }).returning();
  const [b] = await db.insert(businesses).values({ ownerId: u.id, name: "Northwind Studio" }).returning();
  businessId = b.id;
  await createDefaultAccounts(db, businessId);
});

async function paidInvoice(cents: number, issued: string, paidOn: string) {
  const c = await createCustomer(db, businessId, { name: "Atlas Freight", email: "ap@atlas.example" });
  const inv = await createInvoice(db, businessId, { customerId: c.id, issueDate: issued, dueDate: issued, lines: [{ description: "Work", quantity: 1, unitCents: cents }] });
  await sendInvoice(db, businessId, inv.id, send);
  await recordPayment(db, businessId, inv.id, { amountCents: cents, method: "bank", receivedOn: paidOn });
  return inv;
}

describe("dates", () => {
  it("shifts months across years", () => {
    expect(shiftMonth("2026-10-04", -1)).toBe("2026-09-01");
    expect(shiftMonth("2026-01-31", -1)).toBe("2025-12-01");
    expect(shiftMonth("2026-12-15", 1)).toBe("2027-01-01");
    expect(shiftMonth("2026-10-01", -12)).toBe("2025-10-01");
  });
});

describe("monthly keep series", () => {
  it("uses cash moved in finished months and Home's numbers for the current month", async () => {
    const cash = await accountBySubtype(db, businessId, "cash");
    const rent = await accountByCode(db, businessId, "6050");
    await paidInvoice(400000, "2026-08-01", "2026-08-10"); // August: +4,000
    await recordExpense(db, businessId, { description: "Rent", amountCents: 100000, spentOn: "2026-08-12", paidFromAccountId: cash.id, categoryAccountId: rent.id });
    await recordExpense(db, businessId, { description: "Rent", amountCents: 50000, spentOn: "2026-09-12", paidFromAccountId: cash.id, categoryAccountId: rent.id }); // September: −500
    await paidInvoice(200000, "2026-10-01", "2026-10-02"); // October so far

    const { series, ytd, average } = await monthlyKeepSeries(db, businessId, T, 6);
    expect(series.map((m) => m.month)).toEqual(["2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01"]);
    const aug = series[3];
    expect(aug.profit).toBe(300000);
    expect(aug.tax).toBe(75000); // 25%
    expect(aug.keep).toBe(225000);
    const sep = series[4];
    expect(sep.profit).toBe(-50000);
    expect(sep.tax).toBe(0); // no tax on a loss
    expect(sep.keep).toBe(-50000);
    const oct = series[5];
    const n = await threeNumbers(db, businessId, "month", T);
    expect(oct.current).toBe(true);
    expect(oct.keep).toBe(n.yoursToKeep);
    expect(ytd).toBe(225000 - 50000 + n.yoursToKeep);
    expect(average).toBe(Math.round((225000 - 50000) / 5));
  });

  it("ignores opening balances and transfers", async () => {
    const cash = await accountBySubtype(db, businessId, "cash");
    const opening = await accountBySubtype(db, businessId, "opening");
    await postEntry(db, { businessId, date: "2026-09-01", memo: "Opening", sourceType: "opening", lines: [{ accountId: cash.id, debit: 500000 }, { accountId: opening.id, credit: 500000 }] });
    const { series } = await monthlyKeepSeries(db, businessId, T, 6);
    expect(series[4].comingIn).toBe(0);
  });
});

describe("safe to spend", () => {
  it("is cash minus card balances, unpaid bills and this month's tax", async () => {
    const cash = await accountBySubtype(db, businessId, "cash");
    const card = await accountBySubtype(db, businessId, "card");
    const opening = await accountBySubtype(db, businessId, "opening");
    const travel = await accountByCode(db, businessId, "6070");
    await postEntry(db, { businessId, date: "2026-08-01", memo: "Opening", sourceType: "opening", lines: [{ accountId: cash.id, debit: 1000000 }, { accountId: opening.id, credit: 1000000 }] });
    await paidInvoice(400000, "2026-10-01", "2026-10-02");
    await recordExpense(db, businessId, { description: "Flight", amountCents: 30000, spentOn: "2026-10-03", paidFromAccountId: card.id, categoryAccountId: travel.id });
    await createBill(db, businessId, { vendorName: "Print Shop", description: "Brochures", categoryAccountId: travel.id, amountCents: 20000, billDate: "2026-10-01", dueDate: "2026-11-20" });

    const s = await safeToSpend(db, businessId, T);
    const n = await threeNumbers(db, businessId, "month", T);
    expect(s.cash).toBe(1400000);
    expect(s.cardsOwed).toBe(30000);
    expect(s.unpaidBills).toBe(20000);
    expect(s.unpaidBillCount).toBe(1);
    expect(s.taxSetAside).toBe(n.taxSetAside);
    expect(s.safe).toBe(1400000 - 30000 - 20000 - n.taxSetAside);
  });

  it("estimates the quarter's tax from profit so far", async () => {
    await paidInvoice(400000, "2026-10-01", "2026-10-02");
    const t = await taxEstimate(db, businessId, T);
    expect(t.dueDate).toBe("2027-01-15");
    expect(t.quarterProfit).toBe(400000);
    expect(t.estimate).toBe(100000);
  });
});

describe("balance sheet", () => {
  it("balances with retained earnings, using the full sample month", async () => {
    await seedSampleData(db, businessId, { today: T, ...send });
    const sheet = await balanceSheet(db, businessId, T);
    expect(sheet.balanced).toBe(true);
    expect(sheet.totalAssets).toBe(sheet.totalLiabilities + sheet.totalEquity);
    expect(sheet.retainedEarnings).not.toBe(0);
    expect(sheet.equity.some((l) => l.name.includes("retained earnings"))).toBe(true);
    const tb = await trialBalance(db, businessId);
    expect(tb.debit).toBe(tb.credit);
  });

  it("balances on an earlier date too", async () => {
    await seedSampleData(db, businessId, { today: T, ...send });
    expect((await balanceSheet(db, businessId, "2026-09-15")).balanced).toBe(true);
  });
});

describe("report ranges", () => {
  it("resolves presets and the comparison period", () => {
    expect(reportRange({}, T)).toMatchObject({ preset: "this-month", from: "2026-10-01", to: "2026-10-31", prevFrom: "2026-09-01", prevTo: "2026-09-30" });
    expect(reportRange({ range: "last-month" }, T)).toMatchObject({ from: "2026-09-01", to: "2026-09-30", prevFrom: "2026-08-01", prevTo: "2026-08-31" });
    expect(reportRange({ range: "this-quarter" }, T)).toMatchObject({ from: "2026-10-01", to: "2026-12-31", prevFrom: "2026-07-01", prevTo: "2026-09-30" });
    expect(reportRange({ range: "last-year" }, T)).toMatchObject({ from: "2025-01-01", to: "2025-12-31", prevFrom: "2024-01-01", prevTo: "2024-12-31" });
    expect(reportRange({ from: "2026-09-11", to: "2026-09-20" }, T)).toMatchObject({ preset: "custom", prevFrom: "2026-09-01", prevTo: "2026-09-10" });
    expect(reportRange({ from: "2026-09-31", to: "2026-09-20" }, T).preset).toBe("this-month");
  });
});

describe("ledger, search and settings", () => {
  it("pages entries newest first and filters by account", async () => {
    await seedSampleData(db, businessId, { today: T, ...send });
    const all = await ledgerPage(db, businessId, { page: 1, pageSize: 5 });
    expect(all.entries).toHaveLength(5);
    expect(all.total).toBeGreaterThan(5);
    const dates = all.entries.map((e) => e.entryDate);
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const e of all.entries) expect(e.lines.reduce((s, l) => s + l.debit, 0)).toBe(e.lines.reduce((s, l) => s + l.credit, 0));
    const rent = await accountByCode(db, businessId, "6050");
    const filtered = await ledgerPage(db, businessId, { accountId: rent.id });
    expect(filtered.total).toBeGreaterThan(0);
    for (const e of filtered.entries) expect(e.lines.some((l) => l.accountId === rent.id)).toBe(true);
  });

  it("finds customers, invoices, vendors and bank transactions", async () => {
    await seedSampleData(db, businessId, { today: T, ...send });
    const r = await searchBusiness(db, businessId, "atlas");
    expect(r.customers.map((c) => c.name)).toContain("Atlas Freight Co.");
    expect(r.invoices.length).toBe(2);
    expect((await searchBusiness(db, businessId, "INV-0001")).invoices).toHaveLength(1);
    expect((await searchBusiness(db, businessId, "staples")).vendors).toHaveLength(1);
    expect((await searchBusiness(db, businessId, "wework")).transactions.length).toBeGreaterThan(0);
    expect((await searchBusiness(db, businessId, "%")).total).toBe(0);
    expect(await db.select().from(bankFeeds)).toHaveLength(2);
    expect((await db.select().from(bankTransactions)).length).toBeGreaterThan(0);
  });

  it("updates settings and rejects bad input", async () => {
    await updateBusinessSettings(db, businessId, { name: "Northwind Design", invoicePrefix: "NW-", taxRatePct: "30" });
    const c = await createCustomer(db, businessId, { name: "Oak" });
    const inv = await createInvoice(db, businessId, { customerId: c.id, issueDate: T, dueDate: T, lines: [{ description: "x", quantity: 1, unitCents: 100 }] });
    expect(inv.number.startsWith("NW-")).toBe(true);
    expect((await threeNumbers(db, businessId, "month", T)).taxRateBps).toBe(3000);
    await expect(updateBusinessSettings(db, businessId, { name: "", invoicePrefix: "NW-", taxRatePct: 25 })).rejects.toBeInstanceOf(OpError);
    await expect(updateBusinessSettings(db, businessId, { name: "x", invoicePrefix: "NW-", taxRatePct: 80 })).rejects.toBeInstanceOf(OpError);
  });
});
