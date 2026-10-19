import { describe, expect, it } from "vitest";
import { applyMapping, balanceProblems, guessMapping, parseAmount, parseCsvText, parseDate } from "../src/agents/statements/csv";

const read = (csv: string) => {
  const rows = parseCsvText(csv);
  const m = guessMapping(rows);
  if (!m) throw new Error("no mapping");
  return { m, ...applyMapping(rows, m) };
};

describe("parseAmount", () => {
  it.each([
    ["£1,234.56", 123456], ["-1234.56", -123456], ["(1,234.56)", -123456], ["1,234.56-", -123456], ["Rs. 12,500.00 CR", 1250000],
    ["12,500.00 DR", -1250000], ["1.234,56", 123456], ["+48", 4800], ["LKR 2,500", 250000], ["0.5", 50],
  ])("%s → %d", (v, out) => expect(parseAmount(v)).toBe(out));
  it("is null for things that aren't amounts", () => {
    for (const v of ["", "-", "abc", "12/10/2026"]) expect(parseAmount(v)).toBeNull();
  });
});

describe("parseDate", () => {
  it("reads the usual shapes", () => {
    expect(parseDate("01/10/2026", "dmy")).toBe("2026-10-01");
    expect(parseDate("10/01/2026", "mdy")).toBe("2026-10-01");
    expect(parseDate("2026-10-01", "dmy")).toBe("2026-10-01");
    expect(parseDate("1 Oct 2026", "dmy")).toBe("2026-10-01");
    expect(parseDate("01-Oct-26", "dmy")).toBe("2026-10-01");
    expect(parseDate("Oct 1, 2026", "dmy")).toBe("2026-10-01");
    expect(parseDate("31/02/2026", "dmy")).toBeNull();
  });
});

describe("CSV exports", () => {
  it("reads a UK export with one signed amount column and a balance", () => {
    const r = read(`Date,Type,Description,Value,Balance,Account Name,Account Number
01/10/2026,DEB,EE LIMITED,-48.00,1952.00,HARPER STUDIO,12345678
03/10/2026,FPI,KIRKSTALL BREWING CO HS-0007,1200.00,3152.00,HARPER STUDIO,12345678
05/10/2026,DD,ADOBE SYSTEMS,"-19.97",3132.03,HARPER STUDIO,12345678`);
    expect(r.m).toMatchObject({ headerRow: 0, date: 0, amount: 3, balance: 4, dateOrder: "dmy" });
    expect(r.lines).toEqual([
      { date: "2026-10-01", description: "EE LIMITED", amount: -4800, balance: 195200, reference: null },
      { date: "2026-10-03", description: "KIRKSTALL BREWING CO HS-0007", amount: 120000, balance: 315200, reference: null },
      { date: "2026-10-05", description: "ADOBE SYSTEMS", amount: -1997, balance: 313203, reference: null },
    ]);
    expect(balanceProblems(r.lines)).toBe(0);
  });

  it("reads money-out and money-in columns, newest first, with preamble rows", () => {
    const r = read(`"Account: 0123 4567","Harper Studio"
"Statement period","01/10/2026 to 31/10/2026"

Date,Description,Paid out,Paid in,Balance
12/10/2026,CARD PAYMENT TO PRET A MANGER,14.60,,3117.43
10/10/2026,BANK CREDIT OCHRE CAFE,,600.00,3132.03`);
    // Blank lines are dropped, so the header is the third row.
    expect(r.m.headerRow).toBe(2);
    expect(r.lines.map((l) => l.amount)).toEqual([-1460, 60000]);
    expect(balanceProblems(r.lines)).toBe(0);
  });

  it("reads a Sri Lankan export: day-first dates, Dr/Cr columns, cheque numbers, opening balance", () => {
    const r = read(`Txn Date;Value Date;Description;Cheque No;Debit;Credit;Balance
;;Balance B/F;;;;"250,000.00"
02-Oct-2026;02-Oct-2026;CEFT TRF FROM KANDYAN SPICE CO;;;"118,000.00";"368,000.00"
05-Oct-2026;05-Oct-2026;CHQ PAID COLOMBO PAPER MART;004417;"120,500.00";;"247,500.00"
14-Oct-2026;14-Oct-2026;SLT MOBITEL BILL PAYMENT;;"11,800.00";;"235,700.00"`);
    expect(r.openingBalance).toBe(25000000);
    expect(r.lines).toEqual([
      { date: "2026-10-02", description: "CEFT TRF FROM KANDYAN SPICE CO", amount: 11800000, balance: 36800000, reference: null },
      { date: "2026-10-05", description: "CHQ PAID COLOMBO PAPER MART", amount: -12050000, balance: 24750000, reference: "004417" },
      { date: "2026-10-14", description: "SLT MOBITEL BILL PAYMENT", amount: -1180000, balance: 23570000, reference: null },
    ]);
  });

  it("reads an amount with a separate DR/CR column", () => {
    const r = read(`Posting Date,Narration,Amount,Dr/Cr
2026-10-01,SAMPATH CARD FEE,250.00,DR
2026-10-02,INWARD REMITTANCE,5000.00,CR`);
    expect(r.lines.map((l) => [l.date, l.amount])).toEqual([["2026-10-01", -25000], ["2026-10-02", 500000]]);
  });

  it("notices month-first dates and skips rows that aren't transactions", () => {
    const r = read(`Transaction Date,Payee,Amount
10/13/2026,Stripe payout,250.00
10/14/2026,Total,250.00x
,,`);
    expect(r.m.dateOrder).toBe("mdy");
    expect(r.lines).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });

  it("finds no mapping when nothing looks like a header", () => {
    expect(guessMapping(parseCsvText("a,b,c\n1,2,3"))).toBeNull();
  });

  it("counts balances that don't follow", () => {
    expect(balanceProblems([
      { date: "2026-10-01", description: "a", amount: -100, balance: 900, reference: null },
      { date: "2026-10-02", description: "b", amount: -100, balance: 750, reference: null },
    ])).toBe(1);
  });
});
