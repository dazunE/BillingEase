import type { BalanceSheet, ProfitAndLoss } from "@billingease/contracts";
import { minorToDecimal, toCsv } from "@billingease/core";

const d = (minor: number) => minorToDecimal(minor);

/** Profit and loss as a spreadsheet: a section per kind, then the totals. */
export function profitAndLossCsv(pl: ProfitAndLoss, currency: string) {
  const rows = [
    ...pl.income.map((l) => ["Income", l.code, l.name, l.official ?? "", "", d(l.amount)]),
    ...pl.expenses.map((l) => ["Costs", l.code, l.name, l.official ?? "", l.allowable === false ? "No" : "Yes", d(-l.amount)]),
    ["Total", "", "Income", "", "", d(pl.totalIncome)],
    ["Total", "", "Costs", "", "", d(-pl.totalExpenses)],
    ["Total", "", "Profit", "", "", d(pl.profit)],
    ["Total", "", "Not allowable for tax", "", "", d(pl.disallowed)],
  ];
  return toCsv(["Section", "Account", "Name", "Official name", "Allowable", `Amount (${currency})`], rows);
}

export function balanceSheetCsv(bs: BalanceSheet, currency: string) {
  const rows = [
    ...bs.assets.map((l) => ["What you own", l.code, l.name, d(l.amount)]),
    ...bs.liabilities.map((l) => ["What you owe", l.code, l.name, d(l.amount)]),
    ...bs.equity.map((l) => ["Your money in the business", l.code, l.name, d(l.amount)]),
    ["Your money in the business", "", "Profit kept in the business", d(bs.profitToDate)],
    ["Total", "", "What you own", d(bs.totalAssets)],
    ["Total", "", "What you owe", d(bs.totalLiabilities)],
    ["Total", "", "Your money in the business", d(bs.totalEquity)],
  ];
  return toCsv(["Section", "Account", "Name", `Amount (${currency})`], rows);
}
