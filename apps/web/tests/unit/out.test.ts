import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { resetDbForTests, type Db } from "@/db/client";
import { bankTransactions, businesses, merchantRules, users } from "@/db/schema";
import { accountByCode, accountBySubtype, createDefaultAccounts, deleteEntry, trialBalance } from "@/lib/ledger";
import { threeNumbers } from "@/lib/numbers";
import { categorizeTransaction, OpError, payBill } from "@/lib/ops";
import {
  addBill,
  addExpense,
  addVendor,
  assertCategoryFits,
  categoryChoices,
  listBills,
  listTransactions,
  paidThisPeriod,
  sortQueue,
  suggestCategory,
  syncFeeds,
  upcomingPayroll,
  vendorSummaries,
} from "@/lib/ops-out";
import { seedSampleData } from "@/lib/sample";

const T = "2026-10-04";
let db: Db;
let businessId: string;

beforeEach(async () => {
  db = await resetDbForTests();
  const [u] = await db.insert(users).values({ email: "maya@example.com", name: "Maya", passwordHash: "x" }).returning();
  const [b] = await db.insert(businesses).values({ ownerId: u.id, name: "Northwind Studio" }).returning();
  businessId = b.id;
  await createDefaultAccounts(db, businessId);
});

describe("suggestCategory", () => {
  it("guesses common categories from plain words", () => {
    expect(suggestCategory("Client lunch")).toBe("6030");
    expect(suggestCategory("Uber to the airport")).toBe("6070");
    expect(suggestCategory("printer ink")).toBe("6040");
    expect(suggestCategory("Figma subscription")).toBe("6060");
    expect(suggestCategory("Instagram ads")).toBe("6000");
    expect(suggestCategory("Shell gas")).toBe("6090");
    expect(suggestCategory("October rent")).toBe("6050");
  });

  it("doesn't match inside other words and returns null when unsure", () => {
    expect(suggestCategory("")).toBeNull();
    expect(suggestCategory("Something odd")).toBeNull();
    expect(suggestCategory("current account")).toBeNull(); // not "rent"
    expect(suggestCategory("drinks")).toBeNull(); // not "ink"
    expect(suggestCategory("apple")).toBeNull(); // not "app"
  });
});

describe("paidThisPeriod", () => {
  it("lists money leaving cash and card accounts and agrees with the three numbers", async () => {
    const card = await accountBySubtype(db, businessId, "card");
    const cash = await accountBySubtype(db, businessId, "cash");
    const meals = await accountByCode(db, businessId, "6030");
    const rent = await accountByCode(db, businessId, "6050");

    await addExpense(db, businessId, { description: "Client lunch", amountCents: 4250, spentOn: "2026-10-03", paidFromAccountId: card.id, categoryAccountId: meals.id });
    await addExpense(db, businessId, { description: "September lunch", amountCents: 1000, spentOn: "2026-09-20", paidFromAccountId: cash.id, categoryAccountId: meals.id });
    const bill = await addBill(db, businessId, { vendorName: "WeWork", description: "October rent", categoryAccountId: rent.id, amountCents: 120000, billDate: "2026-10-01", dueDate: "2026-10-05" });
    await payBill(db, businessId, bill.id, { paidOn: "2026-10-02" });

    const paid = await paidThisPeriod(db, businessId, "2026-10-01", T);
    expect(paid.rows).toHaveLength(2);
    expect(paid.totalCents).toBe(124250);
    // newest first; the bill payment shows the vendor and the bill's category
    expect(paid.rows[0]).toMatchObject({ who: "Client lunch", category: "Meals", amountCents: 4250 });
    expect(paid.rows[1]).toMatchObject({ who: "WeWork", category: "Rent", sourceType: "bill_payment" });

    const n = await threeNumbers(db, businessId, "month", T);
    expect(n.outPaid).toBe(paid.totalCents);
  });

  it("matches outPaid on the sample business, ignoring the opening balance", async () => {
    await seedSampleData(db, businessId, { today: T, appUrl: "http://localhost", businessName: "Northwind" });
    const n = await threeNumbers(db, businessId, "month", T);
    const paid = await paidThisPeriod(db, businessId, n.start, T);
    expect(paid.totalCents).toBe(n.outPaid);
    expect(paid.rows.every((r) => r.sourceType !== "opening")).toBe(true);
  });
});

describe("checked operations", () => {
  it("rejects expenses paid from or filed under the wrong kind of account", async () => {
    const card = await accountBySubtype(db, businessId, "card");
    const sales = await accountBySubtype(db, businessId, "sales");
    const meals = await accountByCode(db, businessId, "6030");
    await expect(addExpense(db, businessId, { description: "x", amountCents: 100, spentOn: T, paidFromAccountId: meals.id, categoryAccountId: meals.id })).rejects.toBeInstanceOf(OpError);
    await expect(addExpense(db, businessId, { description: "x", amountCents: 100, spentOn: T, paidFromAccountId: card.id, categoryAccountId: sales.id })).rejects.toBeInstanceOf(OpError);
  });

  it("adds bills (creating the vendor) and refuses a due date before the bill date", async () => {
    const rent = await accountByCode(db, businessId, "6050");
    await expect(
      addBill(db, businessId, { vendorName: "WeWork", description: "Rent", categoryAccountId: rent.id, amountCents: 100, billDate: "2026-10-05", dueDate: "2026-10-01" }),
    ).rejects.toBeInstanceOf(OpError);
    await addBill(db, businessId, { vendorName: "WeWork", description: "Rent", categoryAccountId: rent.id, amountCents: 120000, billDate: "2026-10-01", dueDate: "2026-10-20" });
    const unpaid = await listBills(db, businessId, "unpaid");
    expect(unpaid).toHaveLength(1);
    expect(unpaid[0]).toMatchObject({ vendorName: "WeWork", categoryName: "Rent" });
    const n = await threeNumbers(db, businessId, "month", T);
    expect(n.outScheduled).toBe(120000);
  });

  it("adds vendors once and totals what was paid and owed", async () => {
    const rent = await accountByCode(db, businessId, "6050");
    await addVendor(db, businessId, { name: "Staples", email: "ap@staples.example" });
    await expect(addVendor(db, businessId, { name: "staples" })).rejects.toBeInstanceOf(OpError);
    await expect(addVendor(db, businessId, { name: "Bad", email: "nope" })).rejects.toBeInstanceOf(OpError);
    const b1 = await addBill(db, businessId, { vendorName: "WeWork", description: "Sept", categoryAccountId: rent.id, amountCents: 120000, billDate: "2026-09-01", dueDate: "2026-09-05" });
    await addBill(db, businessId, { vendorName: "WeWork", description: "Oct", categoryAccountId: rent.id, amountCents: 125000, billDate: "2026-10-01", dueDate: "2026-10-05" });
    await payBill(db, businessId, b1.id, { paidOn: "2026-09-04" });
    const vs = await vendorSummaries(db, businessId);
    expect(vs.map((v) => v.name)).toEqual(["Staples", "WeWork"]);
    expect(vs[1]).toMatchObject({ paidCents: 120000, owedCents: 125000, billCount: 2, nextDue: "2026-10-05" });
    expect(vs[0]).toMatchObject({ paidCents: 0, owedCents: 0, billCount: 0, nextDue: null });
  });
});

describe("sorting and transactions", () => {
  beforeEach(async () => {
    await seedSampleData(db, businessId, { today: T, appUrl: "http://localhost", businessName: "Northwind" });
  });

  it("queues the four new charges with a guess and quick choices", async () => {
    const q = await sortQueue(db, businessId);
    expect(q).toHaveLength(4);
    const uber = q.find((x) => x.description === "UBER *TRIP")!;
    expect(uber.suggested?.name).toBe("Travel");
    expect(uber.account).toBe("Amex Business ••1009");
    expect(uber.common.length).toBeGreaterThanOrEqual(3);
    expect(uber.common.some((c) => c.name === "Travel")).toBe(false);
    expect(uber.personal?.code).toBe("3100");
    // newest first
    expect(q.map((x) => x.postedOn)).toEqual([...q.map((x) => x.postedOn)].sort().reverse());
  });

  it("only lets money out go to expenses (or personal)", async () => {
    const [tx] = await sortQueue(db, businessId);
    const sales = await accountBySubtype(db, businessId, "sales");
    const drawings = await accountByCode(db, businessId, "3100");
    await expect(assertCategoryFits(db, businessId, tx.id, sales.id)).rejects.toBeInstanceOf(OpError);
    await assertCategoryFits(db, businessId, tx.id, drawings.id);
    const choices = await categoryChoices(db, businessId);
    expect(choices.out.some((c) => c.code === "6900")).toBe(false);
    expect(choices.in.some((c) => c.code === "4000")).toBe(true);
  });

  it("filters transactions and re-syncs without duplicates, applying remembered rules", async () => {
    const all = await listTransactions(db, businessId);
    expect(all).toHaveLength(15);
    expect((await listTransactions(db, businessId, { status: "needs_review" })).length).toBe(4);
    const matched = await listTransactions(db, businessId, { status: "matched" });
    expect(matched[0].invoiceNumber).toMatch(/^INV-/);
    expect((await listTransactions(db, businessId, { q: "wework" })).length).toBe(2);
    expect((await listTransactions(db, businessId, { q: "100%" })).length).toBe(0);

    const feedId = all.find((r) => r.description === "CANVA PRO")!.feedId;
    expect((await listTransactions(db, businessId, { feedId })).length).toBe(9);

    // remember Canva as Advertising, then forget the transaction and sync again
    const canva = all.find((r) => r.description === "CANVA PRO")!;
    const ads = await accountByCode(db, businessId, "6000");
    await categorizeTransaction(db, businessId, canva.id, ads.id, { remember: true });
    expect((await db.select().from(merchantRules).where(eq(merchantRules.businessId, businessId))).length).toBe(1);

    const again = await syncFeeds(db, businessId, T);
    expect(again.imported).toBe(0);
    expect(await listTransactions(db, businessId)).toHaveLength(15);

    const [old] = await db.select().from(bankTransactions).where(eq(bankTransactions.id, canva.id));
    if (old.journalEntryId) await deleteEntry(db, old.journalEntryId);
    await db.delete(bankTransactions).where(eq(bankTransactions.id, canva.id));
    const third = await syncFeeds(db, businessId, T);
    expect(third.imported).toBe(1);
    const [re] = await db
      .select()
      .from(bankTransactions)
      .where(and(eq(bankTransactions.businessId, businessId), eq(bankTransactions.description, "CANVA PRO")));
    expect(re.status).toBe("categorized");
    expect(re.categoryAccountId).toBe(ads.id);
    const tb = await trialBalance(db, businessId);
    expect(tb.debit).toBe(tb.credit);
  });

  it("shows payroll waiting for approval", async () => {
    const runs = await upcomingPayroll(db, businessId, T);
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe("pending");
  });
});
