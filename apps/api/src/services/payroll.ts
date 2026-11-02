import type { PayrollYear, PayrollYearRow } from "@billingease/contracts";
import type { IsoDate } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { employees, payRunLines, payRuns } from "@billingease/db/schema";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import type { BusinessRow } from "../lib/context";

type Sums = Omit<PayrollYearRow, "employeeId" | "name" | "idNumber">;
const zero = (): Sums => ({ runs: 0, gross: 0, tax: 0, epfEe: 0, epfEr: 0, etf: 0, eeNi: 0, erNi: 0, pensionEe: 0, pensionEr: 0, net: 0 });

/**
 * Payroll for the year-end pack: each person's approved pay in runs paid between `from` and `to`
 * (gross, APIT or PAYE, EPF and ETF or NI, pension, net) and the year's total. Null when the
 * business has no one on payroll and no runs.
 */
export async function payrollYear(db: Exec, b: BusinessRow, from: IsoDate, to: IsoDate): Promise<PayrollYear | null> {
  const runs = await db.select({ id: payRuns.id, status: payRuns.status }).from(payRuns)
    .where(and(eq(payRuns.businessId, b.id), gte(payRuns.payDate, from), lte(payRuns.payDate, to)));
  const people = await db.select({ id: employees.id, idNumber: employees.idNumber }).from(employees).where(eq(employees.businessId, b.id));
  if (!runs.length && !people.length) return null;
  const approved = runs.filter((r) => r.status === "approved");
  const lines = approved.length ? await db.select().from(payRunLines).where(inArray(payRunLines.runId, approved.map((r) => r.id))) : [];
  const idNumber = new Map(people.map((p) => [p.id, p.idNumber]));
  const by = new Map<string, PayrollYearRow>();
  const total: PayrollYearRow = { employeeId: null, name: "Total", idNumber: null, ...zero(), runs: approved.length };
  const add = (r: Sums, l: typeof lines[number]) => {
    r.gross += l.gross; r.tax += l.apit + l.paye;
    r.epfEe += l.epfEe; r.epfEr += l.epfEr; r.etf += l.etf;
    r.eeNi += l.eeNi; r.erNi += l.erNi; r.pensionEe += l.pensionEe; r.pensionEr += l.pensionEr;
    r.net += l.net;
  };
  for (const l of lines) {
    const p = by.get(l.employeeId) ?? { employeeId: l.employeeId, name: l.name, idNumber: idNumber.get(l.employeeId) ?? null, ...zero() };
    p.runs += 1;
    add(p, l);
    by.set(l.employeeId, p);
    add(total, l);
  }
  return {
    mode: b.country === "lk" ? "full" : "records",
    runs: approved.length,
    people: [...by.values()].sort((a, c) => a.name.localeCompare(c.name)),
    total,
    drafts: runs.length - approved.length,
  };
}
