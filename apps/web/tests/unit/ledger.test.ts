import { beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { resetDbForTests, type Db } from "@/db/client";
import { businesses, invoices, customers, journalEntries, journalLines, users, bills, vendors } from "@/db/schema";
import { accountByCode, accountBySubtype, createDefaultAccounts, LedgerError, postEntry, profitAndLoss, trialBalance } from "@/lib/ledger";
import { threeNumbers } from "@/lib/numbers";

let db: Db;
let businessId: string;

beforeEach(async () => {
  db = await resetDbForTests();
  const [u] = await db.insert(users).values({ email: "maya@example.com", name: "Maya", passwordHash: "x" }).returning();
  const [b] = await db.insert(businesses).values({ ownerId: u.id, name: "Northwind Studio" }).returning();
  businessId = b.id;
  await createDefaultAccounts(db, businessId);
});

describe("postEntry", () => {
  it("records a balanced entry", async () => {
    const cash = await accountBySubtype(db, businessId, "cash");
    const sales = await accountBySubtype(db, businessId, "sales");
    await postEntry(db, { businessId, date: "2026-10-02", memo: "Cash sale", sourceType: "bank", lines: [{ accountId: cash.id, debit: 50000 }, { accountId: sales.id, credit: 50000 }] });
    expect(await trialBalance(db, businessId)).toEqual({ debit: 50000, credit: 50000 });
  });

  it("refuses an unbalanced entry", async () => {
    const cash = await accountBySubtype(db, businessId, "cash");
    const sales = await accountBySubtype(db, businessId, "sales");
    await expect(
      postEntry(db, { businessId, date: "2026-10-02", memo: "Bad", sourceType: "bank", lines: [{ accountId: cash.id, debit: 100 }, { accountId: sales.id, credit: 90 }] }),
    ).rejects.toBeInstanceOf(LedgerError);
  });

  it("is also enforced by the database at commit", async () => {
    const cash = await accountBySubtype(db, businessId, "cash");
    const sales = await accountBySubtype(db, businessId, "sales");
    await expect(
      db.transaction(async (tx) => {
        const [e] = await tx.insert(journalEntries).values({ businessId, entryDate: "2026-10-02", memo: "Sneaky", sourceType: "bank" }).returning();
        await tx.insert(journalLines).values([
          { entryId: e.id, businessId, accountId: cash.id, debitCents: 100 },
          { entryId: e.id, businessId, accountId: sales.id, creditCents: 99 },
        ]);
      }),
    ).rejects.toThrow();
    const [{ count }] = await db.select({ count: sql<string>`count(*)` }).from(journalEntries);
    expect(Number(count)).toBe(0);
  });
});

describe("profit and loss", () => {
  it("adds income and expenses from the ledger", async () => {
    const cash = await accountBySubtype(db, businessId, "cash");
    const sales = await accountBySubtype(db, businessId, "sales");
    const rent = await accountByCode(db, businessId, "6050");
    await postEntry(db, { businessId, date: "2026-10-01", memo: "Sale", sourceType: "bank", lines: [{ accountId: cash.id, debit: 300000 }, { accountId: sales.id, credit: 300000 }] });
    await postEntry(db, { businessId, date: "2026-10-01", memo: "Rent", sourceType: "expense", lines: [{ accountId: rent.id, debit: 120000 }, { accountId: cash.id, credit: 120000 }] });
    const pl = await profitAndLoss(db, businessId, "2026-10-01", "2026-10-31");
    expect(pl.totalIncome).toBe(300000);
    expect(pl.totalExpenses).toBe(120000);
    expect(pl.netProfit).toBe(180000);
  });
});

describe("three numbers", () => {
  it("computes coming in − going out = yours to keep after tax", async () => {
    const cash = await accountBySubtype(db, businessId, "cash");
    const sales = await accountBySubtype(db, businessId, "sales");
    const rent = await accountByCode(db, businessId, "6050");
    // received $1,000 and paid $200 so far this month
    await postEntry(db, { businessId, date: "2026-10-02", memo: "Sale", sourceType: "bank", lines: [{ accountId: cash.id, debit: 100000 }, { accountId: sales.id, credit: 100000 }] });
    await postEntry(db, { businessId, date: "2026-10-03", memo: "Rent", sourceType: "expense", lines: [{ accountId: rent.id, debit: 20000 }, { accountId: cash.id, credit: 20000 }] });
    // $500 invoice due later this month, $300 late invoice (not counted)
    const [c] = await db.insert(customers).values({ businessId, name: "Atlas Freight" }).returning();
    await db.insert(invoices).values([
      { businessId, customerId: c.id, number: "INV-1", status: "sent", issueDate: "2026-10-01", dueDate: "2026-10-20", totalCents: 50000, publicToken: "t1" },
      { businessId, customerId: c.id, number: "INV-2", status: "sent", issueDate: "2026-09-01", dueDate: "2026-09-20", totalCents: 30000, publicToken: "t2" },
    ]);
    // $100 bill still to pay
    const [v] = await db.insert(vendors).values({ businessId, name: "Comcast" }).returning();
    await db.insert(bills).values({ businessId, vendorId: v.id, description: "Internet", categoryAccountId: rent.id, amountCents: 10000, billDate: "2026-10-01", dueDate: "2026-10-15" });

    const n = await threeNumbers(db, businessId, "month", "2026-10-04");
    expect(n.inReceived).toBe(100000);
    expect(n.inExpected).toBe(50000);
    expect(n.late).toBe(30000);
    expect(n.outPaid).toBe(20000);
    expect(n.outScheduled).toBe(10000);
    expect(n.comingIn).toBe(150000);
    expect(n.goingOut).toBe(30000);
    expect(n.profit).toBe(120000);
    expect(n.taxSetAside).toBe(30000);
    expect(n.yoursToKeep).toBe(90000);
  });
});
