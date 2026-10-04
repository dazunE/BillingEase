import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { resetDbForTests, type Db } from "@/db/client";
import { bankTransactions, businesses, invoices, outboxEmails, payrollRuns, users } from "@/db/schema";
import { accountByCode, accountBySubtype, balancesAsOf, createDefaultAccounts, profitAndLoss, trialBalance } from "@/lib/ledger";
import { threeNumbers } from "@/lib/numbers";
import { approvePayroll, categorizeTransaction, createCustomer, createInvoice, OpError, payBill, recordExpense, recordPayment, sendInvoice, createBill } from "@/lib/ops";
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

describe("invoices", () => {
  it("sends, emails a pay link, and records a partial then full payment", async () => {
    const c = await createCustomer(db, businessId, { name: "Atlas Freight", email: "ap@atlas.example" });
    const inv = await createInvoice(db, businessId, { customerId: c.id, issueDate: "2026-10-01", dueDate: "2026-10-31", lines: [{ description: "Logo", quantity: 2, unitCents: 50000 }] });
    expect(inv.number).toBe("INV-0001");
    expect(inv.totalCents).toBe(100000);
    await sendInvoice(db, businessId, inv.id, send);
    const mail = await db.select().from(outboxEmails);
    expect(mail[0].link).toContain(`/i/${inv.publicToken}`);

    const ar = await accountBySubtype(db, businessId, "ar");
    let bal = await balancesAsOf(db, businessId, T);
    expect(bal.find((b) => b.accountId === ar.id)?.balance).toBe(100000);

    await recordPayment(db, businessId, inv.id, { amountCents: 40000, method: "card", receivedOn: "2026-10-02" });
    await expect(recordPayment(db, businessId, inv.id, { amountCents: 70000, method: "card", receivedOn: "2026-10-02" })).rejects.toBeInstanceOf(OpError);
    await recordPayment(db, businessId, inv.id, { amountCents: 60000, method: "bank", receivedOn: "2026-10-03" });
    const [after] = await db.select().from(invoices).where(eq(invoices.id, inv.id));
    expect(after.status).toBe("paid");
    bal = await balancesAsOf(db, businessId, T);
    expect(bal.find((b) => b.accountId === ar.id)?.balance).toBe(0);
    expect((await trialBalance(db, businessId)).debit).toBe((await trialBalance(db, businessId)).credit);
  });
});

describe("going out", () => {
  it("bills hit expenses when entered and cash when paid", async () => {
    const rent = await accountByCode(db, businessId, "6050");
    const bill = await createBill(db, businessId, { vendorName: "WeWork", description: "October rent", categoryAccountId: rent.id, amountCents: 120000, billDate: "2026-10-01", dueDate: "2026-10-05" });
    let n = await threeNumbers(db, businessId, "month", T);
    expect(n.outScheduled).toBe(120000);
    expect(n.outPaid).toBe(0);
    await payBill(db, businessId, bill.id, { paidOn: "2026-10-03" });
    n = await threeNumbers(db, businessId, "month", T);
    expect(n.outScheduled).toBe(0);
    expect(n.outPaid).toBe(120000);
    const pl = await profitAndLoss(db, businessId, "2026-10-01", "2026-10-31");
    expect(pl.totalExpenses).toBe(120000);
  });

  it("records an expense paid by card", async () => {
    const card = await accountBySubtype(db, businessId, "card");
    const meals = await accountByCode(db, businessId, "6030");
    await recordExpense(db, businessId, { description: "Client lunch", amountCents: 4250, spentOn: "2026-10-03", paidFromAccountId: card.id, categoryAccountId: meals.id });
    const n = await threeNumbers(db, businessId, "month", T);
    expect(n.outPaid).toBe(4250);
  });
});

describe("sample business", () => {
  it("seeds a balanced ledger with things that need the owner", async () => {
    await seedSampleData(db, businessId, { today: T, ...send });
    const tb = await trialBalance(db, businessId);
    expect(tb.debit).toBe(tb.credit);

    const review = await db.select().from(bankTransactions).where(and(eq(bankTransactions.businessId, businessId), eq(bankTransactions.status, "needs_review")));
    expect(review.map((r) => r.description).sort()).toEqual(["AMZN MKTP US", "CANVA PRO", "SQ *BLUE BOTTLE COFFEE", "UBER *TRIP"]);
    const matched = await db.select().from(bankTransactions).where(eq(bankTransactions.status, "matched"));
    expect(matched).toHaveLength(1);

    const n = await threeNumbers(db, businessId, "month", T);
    expect(n.lateCount).toBe(2);
    expect(n.profit).toBe(n.comingIn - n.goingOut);
    expect(n.yoursToKeep + n.taxSetAside).toBe(n.profit);

    // sorting a charge and remembering it
    // (the Uber ride is dated Oct 2, so it counts toward October)
    const travel = await accountByCode(db, businessId, "6070");
    const before = n.outPaid;
    await categorizeTransaction(db, businessId, review.find((r) => r.description.includes("UBER"))!.id, travel.id, { remember: true });
    const n2 = await threeNumbers(db, businessId, "month", T);
    expect(n2.outPaid).toBe(before + 2780);

    // approving payroll keeps it in "still to pay" until pay day
    const [run] = await db.select().from(payrollRuns);
    await approvePayroll(db, businessId, run.id);
    const n3 = await threeNumbers(db, businessId, "month", T);
    expect(n3.outPaid).toBe(n2.outPaid);
    expect(n3.outScheduled).toBe(n2.outScheduled);
  });
});

describe("bank charges that pay known bills", () => {
  it("settle the bill instead of counting the cost twice", async () => {
    const rent = await accountByCode(db, businessId, "6050");
    await createBill(db, businessId, { vendorName: "WeWork", description: "October rent", categoryAccountId: rent.id, amountCents: 120000, billDate: "2026-10-01", dueDate: "2026-10-05" });
    const { importTransactions } = await import("@/lib/ops");
    const { bankFeeds } = await import("@/db/schema");
    const cash = await accountBySubtype(db, businessId, "cash");
    const [feed] = await db.insert(bankFeeds).values({ businessId, accountId: cash.id, provider: "sandbox", institution: "Chase", mask: "4417" }).returning();
    await importTransactions(db, businessId, feed.id, [{ externalId: "x1", postedOn: "2026-10-03", description: "WEWORK RENT", amountCents: -120000 }]);
    const pl = await profitAndLoss(db, businessId, "2026-10-01", "2026-10-31");
    expect(pl.totalExpenses).toBe(120000);
    const n = await threeNumbers(db, businessId, "month", T);
    expect(n.outPaid).toBe(120000);
    expect(n.outScheduled).toBe(0);
  });
});
