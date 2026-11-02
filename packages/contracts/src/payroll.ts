import { z } from "zod";
import { endpoint, IsoDate, Minor, Ok, optionalText } from "./endpoint";

/**
 * Payroll. Sri Lanka: BillingEase works out each person's month (EPF, ETF, APIT, net pay);
 * approving a run posts it and lists what to pay. UK: records only: each run's figures are
 * entered from the payroll software, which reports to HMRC.
 */

const Allowance = z.object({ name: z.string().trim().min(1, "Name the allowance").max(60), amount: Minor.min(0), epf: z.boolean().default(true) });

export const Employee = z.object({
  id: z.string(),
  name: z.string(),
  job: z.string().nullable(),
  startedOn: IsoDate.nullable(),
  endedOn: IsoDate.nullable(),
  idNumber: z.string().nullable(),
  epfNumber: z.string().nullable(),
  taxCode: z.string().nullable(),
  basic: Minor,
  allowances: z.array(z.object({ name: z.string(), amount: Minor, epf: z.boolean() })),
  pension: z.boolean(),
  bankDetails: z.string().nullable(),
  bankName: z.string().nullable(),
  bankBranch: z.string().nullable(),
  bankAccount: z.string().nullable(),
});
export type Employee = z.infer<typeof Employee>;

export const EmployeeBody = z.object({
  name: z.string().trim().min(1, "Enter their name").max(120),
  job: optionalText(120),
  startedOn: IsoDate.optional().nullable(),
  endedOn: IsoDate.optional().nullable(),
  idNumber: optionalText(40),
  epfNumber: optionalText(40),
  taxCode: optionalText(12),
  basic: Minor.min(0).default(0),
  allowances: z.array(Allowance).max(10).default([]),
  pension: z.boolean().default(false),
  bankDetails: optionalText(200),
  bankName: optionalText(80),
  bankBranch: optionalText(80),
  bankAccount: optionalText(40),
});
export type EmployeeBody = z.input<typeof EmployeeBody>;

export const PayLine = z.object({
  id: z.string(),
  employeeId: z.string(),
  name: z.string(),
  job: z.string().nullable(),
  basic: Minor, allowances: Minor, overtime: Minor, gross: Minor,
  epfBase: Minor, epfEe: Minor, epfEr: Minor, etf: Minor, apit: Minor,
  paye: Minor, eeNi: Minor, erNi: Minor, pensionEe: Minor, pensionEr: Minor,
  net: Minor,
});
export type PayLine = z.infer<typeof PayLine>;

export const PayrollDue = z.object({
  id: z.string(),
  runId: z.string(),
  month: z.string(),
  kind: z.enum(["net", "apit", "epf", "etf", "hmrc", "pension"]),
  label: z.string(),
  payTo: z.string(),
  amount: Minor,
  dueOn: IsoDate,
  daysToDue: z.number().int(),
  paidOn: IsoDate.nullable(),
  reference: z.string().nullable(),
});
export type PayrollDue = z.infer<typeof PayrollDue>;

const RunTotals = {
  gross: Minor, net: Minor, employer: Minor,
  epfEe: Minor, epfEr: Minor, etf: Minor, apit: Minor, paye: Minor, eeNi: Minor, erNi: Minor, pensionEe: Minor, pensionEr: Minor,
  /** Gross pay plus the employer's contributions: what the run costs the business. */
  cost: Minor,
};

export const PayRun = z.object({
  id: z.string(),
  month: z.string(),
  label: z.string(),
  payDate: IsoDate,
  status: z.enum(["draft", "approved"]),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().nullable(),
  people: z.number().int(),
  ...RunTotals,
  /** Everything it owes is paid. */
  settled: z.boolean(),
});
export type PayRun = z.infer<typeof PayRun>;

export const PayRunDetail = PayRun.extend({ lines: z.array(PayLine), dues: z.array(PayrollDue) });
export type PayRunDetail = z.infer<typeof PayRunDetail>;

/** One person's figures for a run. Sri Lanka: only overtime (the rest is worked out). UK: the software's figures. */
const RunLineBody = z.object({
  employeeId: z.string().uuid(),
  overtime: Minor.min(0).default(0),
  gross: Minor.min(0).default(0),
  paye: Minor.default(0),
  eeNi: Minor.min(0).default(0),
  erNi: Minor.min(0).default(0),
  pensionEe: Minor.min(0).default(0),
  pensionEr: Minor.min(0).default(0),
});

export const RunBody = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pick a month"),
  payDate: IsoDate,
  lines: z.array(RunLineBody).min(1, "Add at least one person").max(200),
});
export type RunBody = z.input<typeof RunBody>;

/**
 * Sri Lanka: what an approved run needs to be paid and filed by hand. One row per person, with
 * their NIC, EPF member number and bank, for the EPF C form, the ETF return, the APIT payment
 * and the bank's salary upload. BillingEase doesn't file any of them.
 */
export const ScheduleRow = z.object({
  employeeId: z.string(),
  name: z.string(),
  nic: z.string().nullable(),
  epfNumber: z.string().nullable(),
  bankName: z.string().nullable(),
  bankBranch: z.string().nullable(),
  bankAccount: z.string().nullable(),
  gross: Minor, epfBase: Minor, epfEe: Minor, epfEr: Minor, etf: Minor,
  /** Taxable pay for APIT: the month's gross pay. */
  taxable: Minor,
  apit: Minor,
  /** APIT deducted from them in the year of assessment so far, this run included. */
  apitYear: Minor,
  net: Minor,
});
export type ScheduleRow = z.infer<typeof ScheduleRow>;

export const RunSchedules = z.object({
  runId: z.string(),
  month: z.string(),
  label: z.string(),
  payDate: IsoDate,
  employer: z.object({ name: z.string(), tin: z.string().nullable() }),
  yearLabel: z.string(),
  due: z.object({ epf: IsoDate.nullable(), etf: IsoDate.nullable(), apit: IsoDate.nullable() }),
  payTo: z.object({ epf: z.string(), etf: z.string(), apit: z.string() }),
  rows: z.array(ScheduleRow),
  totals: z.object({ gross: Minor, epfBase: Minor, epfEe: Minor, epfEr: Minor, etf: Minor, taxable: Minor, apit: Minor, net: Minor }),
});
export type RunSchedules = z.infer<typeof RunSchedules>;

/** One person's year (or the year's total) for the year-end pack: Sri Lanka's EPF, ETF and APIT or the UK's PAYE, NI and pension. */
export const PayrollYearRow = z.object({
  employeeId: z.string().nullable(),
  name: z.string(),
  idNumber: z.string().nullable(),
  runs: z.number().int(),
  gross: Minor,
  /** APIT (Sri Lanka) or PAYE (UK). */
  tax: Minor,
  epfEe: Minor, epfEr: Minor, etf: Minor,
  eeNi: Minor, erNi: Minor,
  pensionEe: Minor, pensionEr: Minor,
  net: Minor,
});
export type PayrollYearRow = z.infer<typeof PayrollYearRow>;

export const PayrollYear = z.object({
  mode: z.enum(["full", "records"]),
  /** Approved runs paid in the year. */
  runs: z.number().int(),
  people: z.array(PayrollYearRow),
  total: PayrollYearRow,
  /** Drafts paid in the year, not yet approved, which aren't counted. */
  drafts: z.number().int(),
});
export type PayrollYear = z.infer<typeof PayrollYear>;

export const payroll = {
  /** Everything the payroll page needs: people, runs, what's still to pay, and next month's suggestion. */
  overview: endpoint({
    method: "GET", path: "/payroll",
    response: z.object({
      mode: z.enum(["full", "records"]),
      verified: z.boolean(),
      employees: z.array(Employee),
      runs: z.array(PayRun),
      open: z.array(PayrollDue),
      next: z.object({ month: z.string(), label: z.string(), payDate: IsoDate, exists: z.boolean() }),
      yearToDate: z.object({ label: z.string(), gross: Minor, net: Minor, apit: Minor, paye: Minor, byPerson: z.array(z.object({ employeeId: z.string(), name: z.string(), gross: Minor, tax: Minor })) }),
    }),
  }),
  createEmployee: endpoint({ method: "POST", path: "/payroll/employees", body: EmployeeBody, response: Employee }),
  updateEmployee: endpoint({ method: "PATCH", path: "/payroll/employees/:id", body: EmployeeBody, response: Employee }),
  run: endpoint({ method: "GET", path: "/payroll/runs/:id", response: PayRunDetail }),
  /** Sri Lanka, approved runs: the EPF, ETF and APIT schedules and the bank transfer list. */
  schedules: endpoint({ method: "GET", path: "/payroll/runs/:id/schedules", response: RunSchedules }),
  /** A draft run: Sri Lanka works each line out; the UK takes the figures given. */
  createRun: endpoint({ method: "POST", path: "/payroll/runs", body: RunBody, response: PayRunDetail }),
  updateRun: endpoint({ method: "PUT", path: "/payroll/runs/:id", body: RunBody, response: PayRunDetail }),
  deleteRun: endpoint({ method: "DELETE", path: "/payroll/runs/:id", response: Ok }),
  /** Posts the staff cost and what's owed, and lists the payments due. */
  approveRun: endpoint({ method: "POST", path: "/payroll/runs/:id/approve", roles: ["owner", "accountant"], response: PayRunDetail }),
  /** Records a payment of something a run owes (net pay, APIT, EPF, ETF, PAYE and NI, pension). */
  payDue: endpoint({
    method: "POST", path: "/payroll/dues/:id/pay",
    body: z.object({ paidOn: IsoDate, method: z.string().trim().min(1).max(40).default("Bank transfer"), reference: optionalText(80) }),
    response: PayrollDue,
  }),
};
