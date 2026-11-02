import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

const rs = (n: number) => n * 100;

describe("Sri Lanka schedules", () => {
  it("lists EPF, ETF, APIT and bank transfers for an approved run, with the year's APIT so far", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    const kasun = (await api.post("/payroll/employees", {
      name: "Kasun Perera", idNumber: "199012304567", epfNumber: "1042", basic: rs(320_000), allowances: [{ name: "Transport", amount: rs(20_000), epf: true }],
      bankName: "Commercial Bank", bankBranch: "Kollupitiya", bankAccount: "8001 2345 6789",
    })).body;
    expect(kasun).toMatchObject({ bankName: "Commercial Bank", bankBranch: "Kollupitiya", bankAccount: "8001 2345 6789" });
    const nuwan = (await api.post("/payroll/employees", { name: "Nuwan Bandara", basic: rs(85_000), bankDetails: "BOC Kandy 7654321" })).body;

    const aug = (await api.post("/payroll/runs", { month: "2026-08", payDate: "2026-08-31", lines: [{ employeeId: kasun.id }] })).body;
    await api.post(`/payroll/runs/${aug.id}/approve`);
    const sep = (await api.post("/payroll/runs", { month: "2026-09", payDate: "2026-09-30", lines: [{ employeeId: kasun.id }, { employeeId: nuwan.id, overtime: rs(9_500) }] })).body;

    // A draft has no schedules yet.
    expect((await api.get(`/payroll/runs/${sep.id}/schedules`)).status).toBe(400);
    await api.post(`/payroll/runs/${sep.id}/approve`);

    const s = await api.get(`/payroll/runs/${sep.id}/schedules`);
    expect(s.status).toBe(200);
    expect(s.body).toMatchObject({
      month: "2026-09", label: "September 2026", payDate: "2026-09-30", yearLabel: "2026/27",
      due: { apit: "2026-10-15", epf: "2026-10-30", etf: "2026-10-30" },
      payTo: { epf: "EPF, Central Bank of Sri Lanka" },
      totals: { gross: rs(434_500), epfBase: rs(425_000), epfEe: rs(34_000), epfEr: rs(51_000), etf: rs(12_750), taxable: rs(434_500), apit: rs(29_500), net: rs(371_000) },
    });
    const [k, n] = s.body.rows;
    expect(k).toMatchObject({ name: "Kasun Perera", nic: "199012304567", epfNumber: "1042", epfBase: rs(340_000), epfEe: rs(27_200), epfEr: rs(40_800), etf: rs(10_200), apit: rs(29_500), apitYear: rs(59_000), net: rs(283_300), bankName: "Commercial Bank", bankAccount: "8001 2345 6789" });
    // Overtime stays out of EPF; the old free-text bank details still show.
    expect(n).toMatchObject({ name: "Nuwan Bandara", nic: null, gross: rs(94_500), epfBase: rs(85_000), apit: 0, bankName: "BOC Kandy 7654321", bankAccount: null });

    // The August run's year-to-date APIT stops at August.
    expect((await api.get(`/payroll/runs/${aug.id}/schedules`)).body.rows[0].apitYear).toBe(rs(29_500));
  });

  it("is only for Sri Lanka and only your own runs", async () => {
    const uk = await signUpWithBusiness(t.app, "uk");
    const tom = (await uk.api.post("/payroll/employees", { name: "Tom" })).body;
    const run = (await uk.api.post("/payroll/runs", { month: "2026-09", payDate: "2026-09-30", lines: [{ employeeId: tom.id, gross: 100_000 }] })).body;
    expect((await uk.api.get(`/payroll/runs/${run.id}/schedules`)).status).toBe(404);
    const lk = await signUpWithBusiness(t.app, "lk");
    expect((await lk.api.get(`/payroll/runs/${run.id}/schedules`)).status).toBe(404);
  });
});

describe("payroll in the year-end pack", () => {
  it("Sri Lanka: each person's year of assessment, approved runs only", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    expect((await api.get("/books/year-end")).body.payroll).toBeNull();
    const kasun = (await api.post("/payroll/employees", { name: "Kasun Perera", idNumber: "199012304567", basic: rs(320_000), allowances: [{ name: "Transport", amount: rs(20_000), epf: true }] })).body;
    for (const [month, payDate] of [["2026-08", "2026-08-31"], ["2026-09", "2026-09-30"]]) {
      const r = (await api.post("/payroll/runs", { month, payDate, lines: [{ employeeId: kasun.id }] })).body;
      await api.post(`/payroll/runs/${r.id}/approve`);
    }
    await api.post("/payroll/runs", { month: "2026-10", payDate: "2026-10-30", lines: [{ employeeId: kasun.id }] });
    const p = (await api.get("/books/year-end")).body.payroll;
    expect(p).toMatchObject({ mode: "full", runs: 2, drafts: 1 });
    expect(p.people).toEqual([expect.objectContaining({ name: "Kasun Perera", idNumber: "199012304567", runs: 2, gross: rs(680_000), tax: rs(59_000), epfEe: rs(54_400), epfEr: rs(81_600), etf: rs(20_400), net: rs(566_600) })]);
    expect(p.total).toMatchObject({ name: "Total", gross: rs(680_000), tax: rs(59_000), net: rs(566_600) });
    // Last year had none of it.
    expect((await api.get("/books/year-end?date=2025-06-01")).body.payroll).toMatchObject({ runs: 0, people: [] });
  });

  it("UK: PAYE, NI and pension per person for the tax year", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const tom = (await api.post("/payroll/employees", { name: "Tom Whitaker", idNumber: "QQ123456C", taxCode: "1257L", pension: true })).body;
    const line = { employeeId: tom.id, gross: 112000, paye: 1435, eeNi: 580, erNi: 10550, pensionEe: 3000, pensionEr: 1800 };
    for (const [month, payDate] of [["2026-08", "2026-08-28"], ["2026-09", "2026-09-30"]]) {
      const r = (await api.post("/payroll/runs", { month, payDate, lines: [line] })).body;
      await api.post(`/payroll/runs/${r.id}/approve`);
    }
    const p = (await api.get("/books/year-end")).body.payroll;
    expect(p).toMatchObject({ mode: "records", runs: 2, drafts: 0 });
    expect(p.people[0]).toMatchObject({ name: "Tom Whitaker", idNumber: "QQ123456C", gross: 224000, tax: 2870, eeNi: 1160, erNi: 21100, pensionEe: 6000, pensionEr: 3600, net: 213970, epfEe: 0 });
    expect(p.total).toMatchObject({ gross: 224000, tax: 2870, net: 213970 });
  });
});
