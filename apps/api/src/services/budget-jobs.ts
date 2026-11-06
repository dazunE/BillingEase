import { today } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { budgets, businesses, journalEntries } from "@billingease/db/schema";
import { and, gt, inArray, isNull, sql } from "drizzle-orm";
import { checkBudgetAlerts, sendWeekly, settingsOf, weeklyDue } from "./budgets";

/**
 * Alerts for the businesses whose books changed in the last few minutes (an expense, a bill, a
 * payroll run, an approved draft: everything posts to the ledger). The window overlaps the job's
 * interval so nothing is missed; checkBudgetAlerts only sends each level once a month.
 */
export async function budgetAlertsJob(db: Exec, now = new Date()) {
  const since = new Date(now.getTime() - 3 * 60_000);
  const changed = await db.selectDistinct({ id: journalEntries.businessId }).from(journalEntries)
    .where(and(gt(journalEntries.createdAt, since), inArray(journalEntries.businessId, db.selectDistinct({ id: budgets.businessId }).from(budgets))));
  if (!changed.length) return 0;
  const rows = await db.select().from(businesses).where(and(inArray(businesses.id, changed.map((c) => c.id)), isNull(businesses.closedAt)));
  let sent = 0;
  for (const b of rows) sent += (await checkBudgetAlerts(db, b, today())).length;
  return sent;
}

/** Monday from 8am local time: one summary per business with budgets and the summary on. */
export async function budgetWeeklyJob(db: Exec, now: Date) {
  const rows = await db.select().from(businesses)
    .where(and(isNull(businesses.closedAt), sql`exists (select 1 from ${budgets} where ${budgets.businessId} = ${businesses.id})`));
  let sent = 0;
  for (const b of rows) {
    const s = settingsOf(b);
    if (!s.weekly) continue;
    const day = weeklyDue(b.country, now, s.weeklySent);
    if (day && (await sendWeekly(db, b, today(), day))) sent++;
  }
  return sent;
}


