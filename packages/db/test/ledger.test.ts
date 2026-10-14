import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { connect, postEntry, reverseEntry, seedAccounts, trialBalance, LockedPeriodError, allowPurge, type DbHandle } from "../src";
import { businesses, journalEntries, journalLines, lockedPeriods } from "../src/schema";

let h: DbHandle;
let biz: string;

beforeAll(async () => {
  h = await connect({ pgliteDir: "memory://" });
  const [b] = await h.db.insert(businesses).values({
    country: "lk", currency: "LKR", name: "Test", kind: "sole_proprietor", ownerName: "A", basis: "accrual", termsDays: 30,
  }).returning();
  biz = b.id;
  await seedAccounts(h.db, biz, "lk");
});
afterAll(() => h.close());

describe("ledger in the database", () => {
  it("posts a balanced entry", async () => {
    await postEntry(h.db, { businessId: biz, date: "2026-10-01", memo: "Sale", sourceType: "invoice", lines: [{ code: "1100", debit: 1000 }, { code: "4000", credit: 1000 }] });
    expect(await trialBalance(h.db, biz)).toEqual({ debit: 1000, credit: 1000 });
  });

  it("the database rejects an unbalanced entry even if the app skips its check", async () => {
    await expect(h.db.transaction(async (tx) => {
      const [e] = await tx.insert(journalEntries).values({ businessId: biz, entryDate: "2026-10-01", memo: "bad", sourceType: "journal" }).returning();
      const acc = await tx.query.accounts.findMany({ where: (a, { eq: e2 }) => e2(a.businessId, biz) });
      await tx.insert(journalLines).values({ entryId: e.id, businessId: biz, accountId: acc[0].id, debit: 5, credit: 0 });
    })).rejects.toThrow();
  });

  it("is append-only and reverses instead", async () => {
    const id = await postEntry(h.db, { businessId: biz, date: "2026-10-02", memo: "Oops", sourceType: "expense", lines: [{ code: "6000", debit: 700 }, { code: "1000", credit: 700 }] });
    await expect(h.db.delete(journalLines).where(eq(journalLines.entryId, id))).rejects.toThrow();
    await expect(h.db.update(journalEntries).set({ memo: "changed" }).where(eq(journalEntries.id, id))).rejects.toThrow();
    const rev = await reverseEntry(h.db, biz, id);
    expect(rev).toBeTruthy();
    expect(await reverseEntry(h.db, biz, id)).toBeNull();
  });

  it("refuses entries in a filed period", async () => {
    await h.db.insert(lockedPeriods).values({ businessId: biz, fromDate: "2026-08-01", toDate: "2026-08-31", label: "August 2026" });
    await expect(postEntry(h.db, { businessId: biz, date: "2026-08-15", memo: "Late", sourceType: "expense", lines: [{ code: "6000", debit: 1 }, { code: "1000", credit: 1 }] }))
      .rejects.toBeInstanceOf(LockedPeriodError);
  });

  it("deletes a whole business only when purging", async () => {
    await expect(h.db.delete(businesses).where(eq(businesses.id, biz))).rejects.toThrow();
    await h.db.transaction(async (tx) => { await allowPurge(tx); await tx.delete(businesses).where(eq(businesses.id, biz)); });
    expect(await h.db.select().from(businesses)).toHaveLength(0);
  });
});
