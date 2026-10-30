import { describe, expect, it } from "vitest";
import {
  addMonths, balanced, chartOfAccounts, computeInvoice, formatMoney, lk, parseMoney, posting, rulesFor, uk, us,
} from "../src";

describe("money", () => {
  it("formats pounds and rupees", () => {
    expect(formatMoney(125000, "GBP")).toBe("£1,250");
    expect(formatMoney(125050, "GBP")).toBe("£1,250.50");
    expect(formatMoney(12095000, "LKR")).toBe("Rs 120,950");
    expect(formatMoney(-500, "GBP")).toBe("−£5");
    expect(formatMoney(150050, "USD")).toBe("$1,500.50");
  });
  it("parses typed amounts", () => {
    expect(parseMoney("1,250")).toBe(125000);
    expect(parseMoney("£12.5")).toBe(1250);
    expect(parseMoney("Rs 120,950.00")).toBe(12095000);
    expect(parseMoney("$1,250.50")).toBe(125050);
    expect(parseMoney("USD 40")).toBe(4000);
    expect(parseMoney("12.345")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
  });
});

describe("dates and periods", () => {
  it("keeps month ends", () => expect(addMonths("2026-01-31", 1)).toBe("2026-02-28"));
  it("UK tax year runs 6 April to 5 April", () => {
    expect(uk.taxYearOf("2026-04-05").label).toBe("2025/26");
    expect(uk.taxYearOf("2026-04-06")).toEqual({ from: "2026-04-06", to: "2027-04-05", label: "2026/27" });
  });
  it("UK standard MTD quarters", () => {
    const q2 = uk.periodOf("2026-10-05");
    expect(q2).toMatchObject({ id: "2026-q2", from: "2026-07-06", to: "2026-10-05", due: "2026-11-07" });
    const q4 = uk.periodOf("2027-02-01");
    expect(q4).toMatchObject({ id: "2026-q4", from: "2027-01-06", to: "2027-04-05", due: "2027-05-07" });
  });
  it("UK calendar quarters", () => {
    expect(uk.periodOf("2026-09-30", { quarterType: "calendar" })).toMatchObject({ from: "2026-07-01", to: "2026-09-30", due: "2026-11-07" });
  });
  it("Sri Lanka year and VAT months", () => {
    expect(lk.taxYearOf("2026-03-31").label).toBe("2025/26");
    expect(lk.periodOf("2026-09-14")).toMatchObject({ id: "2026-09", from: "2026-09-01", to: "2026-09-30", due: "2026-10-20" });
    expect(lk.periodOf("2026-12-03").due).toBe("2027-01-20");
  });
  it("US calendar tax year and quarters with estimated tax due dates", () => {
    expect(us.taxYearOf("2026-10-30")).toEqual({ from: "2026-01-01", to: "2026-12-31", label: "2026" });
    expect(us.periodOf("2026-02-10")).toMatchObject({ id: "2026-q1", from: "2026-01-01", to: "2026-03-31", due: "2026-04-15" });
    expect(us.periodOf("2026-10-30")).toMatchObject({ id: "2026-q4", from: "2026-10-01", to: "2026-12-31", due: "2027-01-15" });
  });
});

describe("invoice tax", () => {
  it("UK, not VAT registered: no VAT", () => {
    const t = computeInvoice([{ quantityMilli: 1000, unitPrice: 60000 }], { country: "uk", vatRegistered: false });
    expect(t).toMatchObject({ net: 60000, vat: 0, sscl: 0, total: 60000 });
  });
  it("UK VAT invoice at 20% and 5%", () => {
    const t = computeInvoice(
      [{ quantityMilli: 2500, unitPrice: 4000, vatRateId: "std" }, { quantityMilli: 1000, unitPrice: 1000, vatRateId: "reduced" }],
      { country: "uk", vatRegistered: true },
    );
    expect(t.net).toBe(11000);
    expect(t.vat).toBe(2000 + 50);
    expect(t.vatByRate.map((r) => [r.vatRateId, r.base, r.vat])).toEqual([["std", 10000, 2000], ["reduced", 1000, 50]]);
  });
  it("Sri Lanka Tax Invoice: SSCL 2.5% then VAT 18% on net plus SSCL", () => {
    const t = computeInvoice([{ quantityMilli: 1000, unitPrice: 25_000_000 }], { country: "lk", vatRegistered: true, ssclRegistered: true });
    expect(t.sscl).toBe(625_000);
    expect(t.vat).toBe(4_612_500);
    expect(t.total).toBe(30_237_500);
  });
  it("Sri Lanka Rs 100,000 gives SSCL 2,500 and VAT 18,450", () => {
    const t = computeInvoice([{ quantityMilli: 1000, unitPrice: 10_000_000 }], { country: "lk", vatRegistered: true, ssclRegistered: true });
    expect([t.sscl, t.vat, t.total]).toEqual([250_000, 1_845_000, 12_095_000]);
  });
  it("rejects bad lines", () => {
    expect(() => computeInvoice([{ quantityMilli: 0, unitPrice: 100 }], { country: "uk", vatRegistered: false })).toThrow();
    expect(() => computeInvoice([{ quantityMilli: 1000, unitPrice: 100, discount: 200 }], { country: "uk", vatRegistered: false })).toThrow();
    expect(() => computeInvoice([{ quantityMilli: 1000, unitPrice: 100, vatRateId: "fin" }], { country: "uk", vatRegistered: true })).toThrow();
  });
});

describe("ledger", () => {
  it("charts follow the country", () => {
    const ukCodes = chartOfAccounts("uk").map((a) => a.code);
    const lkCodes = chartOfAccounts("lk").map((a) => a.code);
    expect(ukCodes).toContain("4500");
    expect(ukCodes).not.toContain("2210");
    expect(lkCodes).toContain("2210");
    expect(new Set(ukCodes).size).toBe(ukCodes.length);
    expect(new Set(lkCodes).size).toBe(lkCodes.length);
    for (const c of rulesFor("uk").categories) expect(ukCodes).toContain(c.accountCode);
  });
  it("invoice, receipt, expense and bill postings balance", () => {
    const t = computeInvoice([{ quantityMilli: 1000, unitPrice: 10_000_000 }], { country: "lk", vatRegistered: true, ssclRegistered: true });
    expect(() => balanced(posting.invoice(t))).not.toThrow();
    expect(() => balanced(posting.creditNote(t))).not.toThrow();
    expect(() => balanced(posting.receipt(500, "Cheque"))).not.toThrow();
    const e = balanced(posting.expense({ gross: 12000, vat: 2000, bizPct: 50, categoryCode: "6060", method: "Card", vatRegistered: true }));
    expect(e).toEqual([
      { code: "6060", debit: 5000, credit: 0 },
      { code: "1200", debit: 1000, credit: 0 },
      { code: "3100", debit: 6000, credit: 0 },
      { code: "2050", debit: 0, credit: 12000 },
    ]);
    expect(() => balanced(posting.bill([{ categoryCode: "6020", net: 1000, vat: 180 }], false))).not.toThrow();
  });
  it("refuses unbalanced entries", () => {
    expect(() => balanced([{ code: "1000", debit: 5 }, { code: "4000", credit: 4 }])).toThrow(/Unbalanced/);
  });
});

describe("estimates", () => {
  it("UK: Class 4 NI only on trading profit", () => {
    const all = uk.estimate(4_000_000);
    const withRent = uk.estimate(4_000_000, { tradingProfit: 3_000_000 });
    expect(withRent.total).toBeLessThan(all.total);
    expect(all.total).toBe(Math.round((4_000_000 - 1_257_000) * 0.2) + Math.round((4_000_000 - 1_257_000) * 0.06));
  });
  it("Sri Lanka: nothing under the relief", () => {
    expect(lk.estimate(150_000_000).total).toBe(0);
    expect(lk.estimate(300_000_000).total).toBe(Math.round(100_000_000 * 0.06 + 20_000_000 * 0.18));
  });
});
