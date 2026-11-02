import { describe, expect, it } from "vitest";
import { balanced } from "../src/ledger";
import { lastWorkingDay, lkPay, payrollDues, payrollPosting, ukCheck, ukLine, ukTaxMonth } from "../src/payroll";

const rs = (n: number) => n * 100;

describe("Sri Lanka payroll", () => {
  it("works out EPF, ETF, APIT and net pay like the prototype", () => {
    // Kasun Perera: basic 320,000 and a 20,000 transport allowance.
    const k = lkPay({ basic: rs(320_000), allowances: [{ name: "Transport", amount: rs(20_000), epf: true }] });
    expect(k).toMatchObject({ gross: rs(340_000), epfBase: rs(340_000), epfEe: rs(27_200), epfEr: rs(40_800), etf: rs(10_200), apit: rs(29_500), net: rs(283_300) });
    // Below Rs 150,000 a month there's no APIT; overtime is left out of EPF.
    const n = lkPay({ basic: rs(85_000), allowances: [] }, rs(9_500));
    expect(n).toMatchObject({ gross: rs(94_500), epfBase: rs(85_000), epfEe: rs(6_800), apit: 0, net: rs(87_700) });
    // An allowance marked not for EPF stays out of it.
    expect(lkPay({ basic: rs(100_000), allowances: [{ name: "Meals", amount: rs(10_000), epf: false }] }).epfBase).toBe(rs(100_000));
  });

  it("owes APIT on the 15th and EPF and ETF by the last working day of the next month", () => {
    const d = payrollDues("lk", "2026-10", "2026-10-30", { net: 100, epfEe: 8, epfEr: 12, etf: 3, apit: 5, paye: 0, eeNi: 0, erNi: 0, pensionEe: 0, pensionEr: 0 });
    expect(d.map((x) => [x.kind, x.amount, x.due])).toEqual([["net", 100, "2026-10-30"], ["apit", 5, "2026-11-15"], ["epf", 20, "2026-11-30"], ["etf", 3, "2026-11-30"]]);
    expect(lastWorkingDay("2026-10-01")).toBe("2026-10-30");
  });
});

describe("UK payroll records", () => {
  it("takes net pay from the software's figures and dates PAYE to the 22nd", () => {
    expect(ukLine({ gross: 112000, paye: 1435, eeNi: 580, erNi: 10550, pensionEe: 3000, pensionEr: 1800 }).net).toBe(106985);
    expect(ukTaxMonth("2026-09-30")).toEqual({ n: 6, from: "2026-09-06", to: "2026-10-05", due: "2026-10-22" });
    expect(ukTaxMonth("2026-10-03").due).toBe("2026-10-22");
    const d = payrollDues("uk", "2026-09", "2026-09-30", { net: 106985, epfEe: 0, epfEr: 0, etf: 0, apit: 0, paye: 1435, eeNi: 580, erNi: 10550, pensionEe: 3000, pensionEr: 1800 });
    expect(d.map((x) => [x.kind, x.amount, x.due])).toEqual([["net", 106985, "2026-09-30"], ["hmrc", 12565, "2026-10-22"], ["pension", 4800, "2026-10-22"]]);
  });

  it("has a rough check calculator close to the prototype's", () => {
    const c = ukCheck(112000, "1257L", true);
    expect(c.paye).toBeGreaterThan(1300);
    expect(c.paye).toBeLessThan(1600);
    expect(c.eeNi).toBe(580);
    expect(c.erNi).toBe(10550);
    expect(c.pensionEe).toBe(3000);
    expect(ukCheck(112000, "BR", false).paye).toBe(22400);
  });
});

describe("payroll postings", () => {
  it("balance: staff cost against what's owed", () => {
    const t = { gross: rs(340_000), net: rs(283_300), epfEe: rs(27_200), epfEr: rs(40_800), etf: rs(10_200), apit: rs(29_500), paye: 0, eeNi: 0, erNi: 0, pensionEe: 0, pensionEr: 0 };
    const lines = balanced(payrollPosting("6010", t));
    const dr = lines.reduce((a, l) => a + l.debit, 0), cr = lines.reduce((a, l) => a + l.credit, 0);
    expect(dr).toBe(cr);
    expect(dr).toBe(rs(340_000 + 40_800 + 10_200));
  });
});
