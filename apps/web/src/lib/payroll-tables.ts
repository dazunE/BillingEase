import type { PayrollYear, RunSchedules } from "@billingease/contracts";
import { formatDate, minorToDecimal, toCsv, type Cell } from "@billingease/core";

/**
 * The tables payroll hands over (prototype SpendPayroll → schedules and year-end totals), built
 * once and shown on the page or downloaded as CSV. A number cell is an amount in minor units;
 * a string cell is text.
 */

export type TableCell = string | number;
export type Table = { title: string; head: string; cols: string[]; rows: TableCell[][]; total: TableCell[]; due: string; file: string };

export const SCHEDULES = ["epf", "etf", "apit", "bank"] as const;
export type ScheduleKind = (typeof SCHEDULES)[number];
export const SCHEDULE_LABELS: Record<ScheduleKind, string> = { epf: "EPF (C form)", etf: "ETF", apit: "APIT", bank: "Bank transfer list" };

const dash = (v: string | null) => v ?? "";
const date = (d: string | null) => (d ? formatDate(d, { year: true }) : "");

/** One of the run's four schedules. */
export function scheduleTable(kind: ScheduleKind, s: RunSchedules): Table {
  const t = s.totals;
  const file = `${kind}-${s.month}`;
  if (kind === "epf") return {
    title: "EPF contributions (C form style)", file,
    head: `${s.employer.name} · contributions for ${s.label}`,
    cols: ["Name", "NIC", "Member no", "Total earnings", "Employee 8%", "Employer 12%", "Total"],
    rows: s.rows.map((r) => [r.name, dash(r.nic), dash(r.epfNumber), r.epfBase, r.epfEe, r.epfEr, r.epfEe + r.epfEr]),
    total: ["Total", "", "", t.epfBase, t.epfEe, t.epfEr, t.epfEe + t.epfEr],
    due: s.due.epf ? `Pay to ${s.payTo.epf} by ${date(s.due.epf)}.` : "",
  };
  if (kind === "etf") return {
    title: "ETF contributions", file,
    head: `${s.employer.name} · contributions for ${s.label}`,
    cols: ["Name", "NIC", "Member no", "Total earnings", "ETF 3%"],
    rows: s.rows.map((r) => [r.name, dash(r.nic), dash(r.epfNumber), r.epfBase, r.etf]),
    total: ["Total", "", "", t.epfBase, t.etf],
    due: s.due.etf ? `Pay to ${s.payTo.etf} by ${date(s.due.etf)}.` : "",
  };
  if (kind === "apit") return {
    title: "APIT deducted", file,
    head: `Employer TIN ${s.employer.tin ?? "not added"} · ${s.label} · year of assessment ${s.yearLabel}`,
    cols: ["Name", "NIC", "Taxable pay", "APIT this month", `APIT ${s.yearLabel} so far`],
    rows: s.rows.map((r) => [r.name, dash(r.nic), r.taxable, r.apit, r.apitYear]),
    total: ["Total", "", t.taxable, t.apit, s.rows.reduce((a, r) => a + r.apitYear, 0)],
    due: s.due.apit ? `Pay to ${s.payTo.apit} by ${date(s.due.apit)}.` : "Nobody on this run pays APIT.",
  };
  return {
    title: "Bank transfer list", file,
    head: `Net pay for ${s.label} · pay day ${date(s.payDate)}`,
    cols: ["Name", "Bank", "Branch", "Account no", "Net pay"],
    rows: s.rows.map((r) => [r.name, dash(r.bankName), dash(r.bankBranch), dash(r.bankAccount), r.net]),
    total: ["Total", "", "", "", t.net],
    due: `Upload to your bank for pay day, ${date(s.payDate)}.`,
  };
}

/** The year-end pack's payroll table: Sri Lanka's EPF, ETF and APIT or the UK's PAYE, NI and pension. */
export function payrollYearTable(p: PayrollYear, yearLabel: string): Table {
  const lk = p.mode === "full";
  const cols = lk
    ? ["Name", "NIC", "Months", "Gross pay", "APIT deducted", "EPF employee 8%", "EPF employer 12%", "ETF 3%", "Net pay"]
    : ["Name", "NI number", "Pay runs", "Gross pay", "PAYE", "Employee NI", "Employer NI", "Employee pension", "Employer pension", "Net pay"];
  const row = (r: PayrollYear["total"], total = false): TableCell[] => lk
    ? [r.name, total ? "" : dash(r.idNumber), total ? "" : String(r.runs), r.gross, r.tax, r.epfEe, r.epfEr, r.etf, r.net]
    : [r.name, total ? "" : dash(r.idNumber), total ? "" : String(r.runs), r.gross, r.tax, r.eeNi, r.erNi, r.pensionEe, r.pensionEr, r.net];
  return {
    title: lk ? `Payroll for ${yearLabel}` : `Payroll for the ${yearLabel} tax year`,
    head: `${p.runs} approved ${p.runs === 1 ? "run" : "runs"}`,
    cols, rows: p.people.map((r) => row(r)), total: row(p.total, true), due: "", file: `payroll-${yearLabel.replace("/", "-")}`,
  };
}

/** A cell for the screen: amounts with separators, no symbol. */
export function showCell(c: TableCell): string {
  return typeof c === "number" ? new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(c / 100) : c;
}

/** The table as CSV text, total row last; amounts as plain decimals. */
export function tableCsv(t: Table): string {
  const cell = (c: TableCell): Cell => (typeof c === "number" ? minorToDecimal(c) : c);
  return toCsv(t.cols, [...t.rows, t.total].map((r) => r.map(cell)));
}
