import { describe, expect, it } from "vitest";
import { filingPeriods, ukVatQuarterOf } from "../src/periods";

const show = (ps: { label: string; from: string; to: string; due: string }[]) => ps.map((p) => `${p.label} ${p.from}..${p.to} due ${p.due}`);

describe("filing periods", () => {
  it("lists the UK's four MTD quarters in the tax year", () => {
    expect(show(filingPeriods({ country: "uk" }, "mtd", "2026-10-11"))).toEqual([
      "Q1 2026/27 2026-04-06..2026-07-05 due 2026-08-07",
      "Q2 2026/27 2026-07-06..2026-10-05 due 2026-11-07",
      "Q3 2026/27 2026-10-06..2027-01-05 due 2027-02-07",
      "Q4 2026/27 2027-01-06..2027-04-05 due 2027-05-07",
    ]);
    expect(filingPeriods({ country: "uk", quarterType: "calendar" }, "mtd", "2026-10-11")[0]).toMatchObject({ from: "2026-04-01", to: "2026-06-30" });
  });

  it("lists UK VAT quarters ending in the tax year, due a month and seven days later", () => {
    expect(show(filingPeriods({ country: "uk" }, "vat", "2026-10-11")).map((s) => s.split(" due ")[0])).toEqual([
      "Apr – Jun 2026 2026-04-01..2026-06-30", "Jul – Sep 2026 2026-07-01..2026-09-30", "Oct – Dec 2026 2026-10-01..2026-12-31", "Jan – Mar 2027 2027-01-01..2027-03-31",
    ]);
    expect(ukVatQuarterOf("2027-02-14")).toMatchObject({ from: "2027-01-01", to: "2027-03-31", due: "2027-05-07" });
  });

  it("lists Sri Lanka's twelve VAT and SSCL months, and nothing for the US", () => {
    const lk = filingPeriods({ country: "lk" }, "vat", "2026-10-11");
    expect(lk).toHaveLength(12);
    expect(lk[0]).toMatchObject({ label: "April 2026", due: "2026-05-20" });
    expect(lk[11]).toMatchObject({ label: "March 2027", to: "2027-03-31" });
    expect(filingPeriods({ country: "us" }, "vat", "2026-10-11")).toEqual([]);
    expect(filingPeriods({ country: "lk" }, "mtd", "2026-10-11")).toEqual([]);
  });
});
