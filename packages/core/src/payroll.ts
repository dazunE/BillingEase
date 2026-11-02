import { bands, type CountryCode } from "./countries";
import { addDays, addMonths, monthEnd, type IsoDate } from "./dates";
import type { PostingLine } from "./ledger";

/**
 * Payroll. Sri Lanka: BillingEase works out each person's month (EPF 8% + 12%, ETF 3%, APIT) and
 * the business pays and files them itself. UK: records only; the pay run's figures come from the
 * payroll software, which reports to HMRC. All amounts in minor units. Rates are illustrative and
 * marked unverified, like the other country rules.
 */

export const PAYROLL_RULES = {
  lk: {
    verified: false,
    epfEmployeeBps: 800,
    epfEmployerBps: 1200,
    etfBps: 300,
    /** Overtime is left out of EPF and ETF earnings; fixed allowances count unless marked otherwise. */
    overtimeInEpf: false,
    /** Monthly APIT on regular profits from employment: the first Rs 150,000 a month is tax-free. */
    apitReliefMonthly: 15_000_000,
    apitBands: [[Math.round(100_000_000 / 12), 600], [Math.round(50_000_000 / 12), 1800], [Math.round(50_000_000 / 12), 2400], [Math.round(50_000_000 / 12), 3000], [Infinity, 3600]] as [number, number][],
    payTo: { apit: "Inland Revenue Department", epf: "EPF, Central Bank of Sri Lanka", etf: "Employees' Trust Fund Board" },
  },
  uk: {
    verified: false,
    payeDueDay: 22,
    /** For the "check the figures" sense check only; the payroll software's figures are the record. */
    check: { personalAllowance: 1_257_000, basicRateBps: 2000, higherRateBps: 4000, basicBand: 3_770_000, eeNiThreshold: 1_257_000, eeNiUpper: 5_027_000, eeNiBps: 800, eeNiUpperBps: 200, erNiThreshold: 500_000, erNiBps: 1500, pensionLower: 624_000, pensionUpper: 5_027_000, pensionEeBps: 500, pensionErBps: 300 },
  },
} as const;

export type Allowance = { name: string; amount: number; epf: boolean };

export type LkPayLine = { basic: number; allowances: number; overtime: number; gross: number; epfBase: number; epfEe: number; epfEr: number; etf: number; apit: number; net: number };

const bps = (minor: number, b: number) => Math.round((minor * b) / 10000);

/** One person's month in Sri Lanka: earnings, EPF and ETF on EPF-liable earnings, APIT and net pay. */
export function lkPay(e: { basic: number; allowances: Allowance[] }, overtime = 0): LkPayLine {
  const R = PAYROLL_RULES.lk;
  const allowances = e.allowances.reduce((a, x) => a + x.amount, 0);
  const epfAllow = e.allowances.filter((x) => x.epf).reduce((a, x) => a + x.amount, 0);
  const epfBase = e.basic + epfAllow + (R.overtimeInEpf ? overtime : 0);
  const gross = e.basic + allowances + overtime;
  const epfEe = bps(epfBase, R.epfEmployeeBps), epfEr = bps(epfBase, R.epfEmployerBps), etf = bps(epfBase, R.etfBps);
  const apit = bands(Math.max(0, gross - R.apitReliefMonthly), R.apitBands);
  return { basic: e.basic, allowances, overtime, gross, epfBase, epfEe, epfEr, etf, apit, net: gross - epfEe - apit };
}

export type UkPayLine = { gross: number; paye: number; eeNi: number; erNi: number; pensionEe: number; pensionEr: number; net: number };

/** A UK pay run line as entered from the payroll software; net is what's left of gross. */
export function ukLine(x: Omit<UkPayLine, "net">): UkPayLine {
  return { ...x, net: x.gross - x.paye - x.eeNi - x.pensionEe };
}

/** Allowance from a tax code like 1257L (BR: none). */
function codeAllowance(code: string) {
  const c = code.trim().toUpperCase();
  if (c === "BR" || c === "0T") return 0;
  const m = /^(\d+)L$/.exec(c);
  return m ? (Number(m[1]) * 10 + 9) * 100 : PAYROLL_RULES.uk.check.personalAllowance;
}

/** A rough monthly PAYE, NI and pension for a gross amount: a sense check, not a payroll calculation. */
export function ukCheck(gross: number, code = "1257L", pension = true): UkPayLine & { hmrc: number } {
  const c = PAYROLL_RULES.uk.check;
  const allowance = Math.round(codeAllowance(code) / 12);
  const taxable = Math.max(0, gross - allowance);
  const band = Math.round(c.basicBand / 12);
  const paye = bps(Math.min(taxable, band), c.basicRateBps) + bps(Math.max(0, taxable - band), c.higherRateBps);
  const pt = Math.round(c.eeNiThreshold / 12), uel = Math.round(c.eeNiUpper / 12);
  const eeNi = bps(Math.max(0, Math.min(gross, uel) - pt), c.eeNiBps) + bps(Math.max(0, gross - uel), c.eeNiUpperBps);
  const erNi = bps(Math.max(0, gross - Math.round(c.erNiThreshold / 12)), c.erNiBps);
  const qe = pension ? Math.max(0, Math.min(gross, Math.round(c.pensionUpper / 12)) - Math.round(c.pensionLower / 12)) : 0;
  const line = ukLine({ gross, paye, eeNi, erNi, pensionEe: bps(qe, c.pensionEeBps), pensionEr: bps(qe, c.pensionErBps) });
  return { ...line, hmrc: paye + eeNi + erNi };
}

/** The last weekday of a month. */
export function lastWorkingDay(month: IsoDate): IsoDate {
  let d = monthEnd(month);
  for (let i = 0; i < 3; i++) {
    const w = new Date(d + "T00:00:00Z").getUTCDay();
    if (w !== 0 && w !== 6) break;
    d = addDays(d, -1);
  }
  return d;
}

/** UK: the tax month a pay date falls in (6th to 5th) and the 22nd its PAYE, NI and pension are due by. */
export function ukTaxMonth(payDate: IsoDate) {
  const day = Number(payDate.slice(8, 10));
  const endMonth = day >= 6 ? addMonths(payDate.slice(0, 8) + "01", 1) : payDate.slice(0, 8) + "01";
  const to = endMonth.slice(0, 8) + "05";
  const from = addMonths(endMonth, -1).slice(0, 8) + "06";
  const n = ((Number(from.slice(5, 7)) - 4 + 12) % 12) + 1;
  return { n, from, to, due: endMonth.slice(0, 8) + String(PAYROLL_RULES.uk.payeDueDay) };
}

export type PayrollDue = { kind: "net" | "apit" | "epf" | "etf" | "hmrc" | "pension"; label: string; payTo: string; amount: number; due: IsoDate };

type Totals = { net: number; epfEe: number; epfEr: number; etf: number; apit: number; paye: number; eeNi: number; erNi: number; pensionEe: number; pensionEr: number };

/** What a run owes once approved, and when: net pay on pay day, then the tax and contributions. */
export function payrollDues(country: CountryCode, month: string, payDate: IsoDate, t: Totals): PayrollDue[] {
  const name = new Date(month + "-01T00:00:00Z").toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
  const out: PayrollDue[] = [{ kind: "net", label: `Net pay for ${name}`, payTo: "Your staff", amount: t.net, due: payDate }];
  if (country === "lk") {
    const next = addMonths(month + "-01", 1);
    const P = PAYROLL_RULES.lk.payTo;
    out.push(
      { kind: "apit", label: `APIT for ${name}`, payTo: P.apit, amount: t.apit, due: next.slice(0, 8) + "15" },
      { kind: "epf", label: `EPF for ${name} (8% + 12%)`, payTo: P.epf, amount: t.epfEe + t.epfEr, due: lastWorkingDay(next) },
      { kind: "etf", label: `ETF for ${name} (3%)`, payTo: P.etf, amount: t.etf, due: lastWorkingDay(next) },
    );
  } else {
    const tm = ukTaxMonth(payDate);
    out.push(
      { kind: "hmrc", label: `PAYE and NI for ${name}`, payTo: "HMRC", amount: t.paye + t.eeNi + t.erNi, due: tm.due },
      { kind: "pension", label: `Workplace pension for ${name}`, payTo: "Pension provider", amount: t.pensionEe + t.pensionEr, due: tm.due },
    );
  }
  return out.filter((d) => d.amount > 0);
}

/** Ledger accounts payroll posts to (added to every chart of accounts). */
export const PAYROLL_ACCOUNTS = { net: "2300", tax: "2310", contributions: "2320" } as const;

/**
 * Approving a run: the staff cost (gross pay plus the employer's contributions) against what's now
 * owed to the staff, the tax office and the funds.
 */
export function payrollPosting(staffCode: string, t: Totals & { gross: number }): PostingLine[] {
  const employer = t.epfEr + t.etf + t.erNi + t.pensionEr;
  return [
    { code: staffCode, debit: t.gross + employer },
    { code: PAYROLL_ACCOUNTS.net, credit: t.net },
    { code: PAYROLL_ACCOUNTS.tax, credit: t.apit + t.paye + t.eeNi + t.erNi },
    { code: PAYROLL_ACCOUNTS.contributions, credit: t.epfEe + t.epfEr + t.etf + t.pensionEe + t.pensionEr },
  ];
}

/** Which liability a due clears when it's paid. */
export function dueAccount(kind: PayrollDue["kind"]): string {
  return kind === "net" ? PAYROLL_ACCOUNTS.net : kind === "apit" || kind === "hmrc" ? PAYROLL_ACCOUNTS.tax : PAYROLL_ACCOUNTS.contributions;
}
