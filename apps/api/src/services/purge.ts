import { allowPurge, type Db } from "@billingease/db";
import { businesses, memberships, users } from "@billingease/db/schema";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import type { Storage } from "./storage";

/**
 * Deletes businesses that were closed more than 30 days ago: the books (the ledger allows it only
 * inside this purge), every record, the files, and the account of whoever closed it when that
 * person has no other business. Safe to run twice.
 */
export async function purgeClosed(db: Db, storage: Storage, now = new Date()) {
  const due = await db.select({ id: businesses.id, closedBy: businesses.closedBy }).from(businesses)
    .where(and(isNotNull(businesses.closedAt), isNotNull(businesses.purgeAfter), lte(businesses.purgeAfter, now)))
    .limit(20);
  for (const b of due) {
    await db.transaction(async (tx) => {
      await allowPurge(tx);
      await tx.delete(businesses).where(and(eq(businesses.id, b.id), isNotNull(businesses.closedAt)));
      if (b.closedBy) {
        const [other] = await tx.select({ id: memberships.businessId }).from(memberships).where(eq(memberships.userId, b.closedBy)).limit(1);
        if (!other) await tx.delete(users).where(eq(users.id, b.closedBy));
      }
    });
    await storage.removeAll(b.id);
  }
  return due.length;
}
