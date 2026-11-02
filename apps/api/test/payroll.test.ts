import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

const rs = (n: number) => n * 100;

describe("Sri Lanka payroll", () => {
  it("works a run out, approves it into the books, and pays what it owes", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk");
    const kasun = (await api.post("/payroll/employees", { name: "Kasun Perera", job: "Senior designer", idNumber: "199012304567", epfNumber: "1042", basic: rs(320_000), allowances: [{ name: "Transport", amount: rs(20_000), epf: true }] })).body;
    const nuwan = (await api.post("/payroll/employees", { name: "Nuwan Bandara", job: "Driver", basic: rs(85_000) })).body;
    expect(kasun.id).toBeTruthy();

    const ov = (await api.get("/payroll")).body;
    expect(ov).toMatchObject({ mode: "full", next: { month: "2026-10", payDate: "2026-10-30", exists: false } });
    expect(ov.employees).toHaveLength(2);

    const draft = await api.post("/payroll/runs", { month: "2026-09", payDate: "2026-09-30", lines: [{ employeeId: kasun.id }, { employeeId: nuwan.id, overtime: rs(9_500) }] });
    expect(draft.status).toBe(200);
    expect(draft.body).toMatchObject({ status: "draft", people: 2, gross: rs(434_500), apit: rs(29_500), epfEe: rs(34_000), net: rs(371_000) });
    const k = draft.body.lines.find((l: { name: string }) => l.name === "Kasun Perera");
    expect(k).toMatchObject({ gross: rs(340_000), epfEr: rs(40_800), etf: rs(10_200), net: rs(283_300) });
    expect((await api.post("/payroll/runs", { month: "2026-09", payDate: "2026-09-30", lines: [{ employeeId: kasun.id }] })).status).toBe(409);

    const ok = await api.post(`/payroll/runs/${draft.body.id}/approve`);
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("approved");
    expect(ok.body.dues.map((d: { kind: string; dueOn: string }) => [d.kind, d.dueOn])).toEqual([["net", "2026-09-30"], ["apit", "2026-10-15"], ["epf", "2026-10-30"], ["etf", "2026-10-30"]]);
    expect((await api.put(`/payroll/runs/${draft.body.id}`, { month: "2026-09", payDate: "2026-09-30", lines: [{ employeeId: kasun.id }] })).status).toBe(400);

    // The staff cost is in the books: gross plus EPF 12% and ETF 3%.
    const pl = (await api.get("/books/profit-and-loss?from=2026-09-01&to=2026-09-30")).body;
    expect(pl.expenses.find((l: { name: string }) => l.name === "Salaries and wages").amount).toBe(rs(434_500 + 40_800 + 10_200 + 10_200 + 2_550));

    // Pay APIT; the rest stays open.
    const apit = ok.body.dues.find((d: { kind: string }) => d.kind === "apit");
    const paid = await api.post(`/payroll/dues/${apit.id}/pay`, { paidOn: "2026-10-10", reference: "IRD-123" });
    expect(paid.body).toMatchObject({ paidOn: "2026-10-10", reference: "IRD-123" });
    expect((await api.post(`/payroll/dues/${apit.id}/pay`, { paidOn: "2026-10-10" })).status).toBe(400);
    const after = (await api.get("/payroll")).body;
    expect(after.open.map((d: { kind: string }) => d.kind)).toEqual(["net", "epf", "etf"]);
    expect(after.yearToDate).toMatchObject({ gross: rs(434_500), apit: rs(29_500) });
    expect(after.next.month).toBe("2026-10");

    // Going out for October counts the APIT paid in it.
    const home = (await api.get("/home?period=month")).body;
    expect(home.goingOut.paid).toBe(rs(29_500));
    const bs = (await api.get("/books/balance-sheet")).body;
    expect(bs.totalAssets - bs.totalLiabilities).toBe(bs.totalEquity);
  });
});

describe("UK payroll records", () => {
  it("takes the software's figures, owes HMRC by the 22nd, and deletes a draft", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const tom = (await api.post("/payroll/employees", { name: "Tom Whitaker", taxCode: "1257L", pension: true })).body;
    expect((await api.get("/payroll")).body.mode).toBe("records");
    const bad = await api.post("/payroll/runs", { month: "2026-09", payDate: "2026-09-30", lines: [{ employeeId: tom.id }] });
    expect(bad.status).toBe(400);
    const run = await api.post("/payroll/runs", { month: "2026-09", payDate: "2026-09-30", lines: [{ employeeId: tom.id, gross: 112000, paye: 1435, eeNi: 580, erNi: 10550, pensionEe: 3000, pensionEr: 1800 }] });
    expect(run.body).toMatchObject({ net: 106985, employer: 12350, cost: 124350 });
    const ok = (await api.post(`/payroll/runs/${run.body.id}/approve`)).body;
    expect(ok.dues.map((d: { kind: string; amount: number; dueOn: string }) => [d.kind, d.amount, d.dueOn])).toEqual([["net", 106985, "2026-09-30"], ["hmrc", 12565, "2026-10-22"], ["pension", 4800, "2026-10-22"]]);
    expect((await api.del(`/payroll/runs/${run.body.id}`)).status).toBe(400);

    const d2 = await api.post("/payroll/runs", { month: "2026-10", payDate: "2026-10-30", lines: [{ employeeId: tom.id, gross: 112000 }] });
    expect((await api.del(`/payroll/runs/${d2.body.id}`)).status).toBe(200);
    expect((await api.get(`/payroll/runs/${d2.body.id}`)).status).toBe(404);
  });

  it("keeps people and runs to their own business", async () => {
    const a = await signUpWithBusiness(t.app, "uk");
    const b = await signUpWithBusiness(t.app, "uk");
    const tom = (await a.api.post("/payroll/employees", { name: "Tom" })).body;
    expect((await b.api.post("/payroll/runs", { month: "2026-09", payDate: "2026-09-30", lines: [{ employeeId: tom.id, gross: 100 }] })).status).toBe(400);
    expect((await b.api.patch(`/payroll/employees/${tom.id}`, { name: "Not yours" })).status).toBe(404);
  });
});
