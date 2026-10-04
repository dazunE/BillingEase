// Checks the app against a real PostgreSQL server (DATABASE_URL): runs the
// migrations, seeds a sample month, and confirms the ledger balances and the
// database rejects an unbalanced entry.
import { sql } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { businesses, journalEntries, journalLines, users } from "../src/db/schema";
import { accountBySubtype, createDefaultAccounts, trialBalance } from "../src/lib/ledger";
import { threeNumbers } from "../src/lib/numbers";
import { seedSampleData } from "../src/lib/sample";

async function main() {
  const db = await getDb();
  const email = `check-${Date.now()}@example.com`;
  const [u] = await db.insert(users).values({ email, name: "Check", passwordHash: "x" }).returning();
  const [b] = await db.insert(businesses).values({ ownerId: u.id, name: "PG Check" }).returning();
  await db.transaction(async (tx) => {
    await createDefaultAccounts(tx, b.id);
    await seedSampleData(tx, b.id, { today: "2026-10-04", appUrl: "http://localhost:3000", businessName: b.name });
  });
  console.log("trial balance", await trialBalance(db, b.id));
  const n = await threeNumbers(db, b.id, "month", "2026-10-04");
  console.log("three numbers", { comingIn: n.comingIn, goingOut: n.goingOut, yoursToKeep: n.yoursToKeep });
  const cash = await accountBySubtype(db, b.id, "cash");
  const sales = await accountBySubtype(db, b.id, "sales");
  try {
    await db.transaction(async (tx) => {
      const [e] = await tx.insert(journalEntries).values({ businessId: b.id, entryDate: "2026-10-04", memo: "bad", sourceType: "bank" }).returning();
      await tx.insert(journalLines).values([
        { entryId: e.id, businessId: b.id, accountId: cash.id, debitCents: 100 },
        { entryId: e.id, businessId: b.id, accountId: sales.id, creditCents: 1 },
      ]);
    });
    console.log("UNEXPECTED: unbalanced entry was accepted");
    process.exit(1);
  } catch (err) {
    console.log("unbalanced entry rejected:", String((err as Error).cause ?? (err as Error).message).slice(0, 90));
  }
  const [{ n: entries }] = await db.select({ n: sql<string>`count(*)` }).from(journalEntries);
  console.log("journal entries", entries);
  process.exit(0);
}
main();
