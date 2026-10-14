import { daysBetween, rulesFor } from "@billingease/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { notify } from "../src/lib/activity";
import { as, signUpWithBusiness } from "./helpers";
import { homeTestApp, seed } from "./home-helpers";

let t: Awaited<ReturnType<typeof homeTestApp>>;
beforeAll(async () => { t = await homeTestApp(); });
afterAll(() => t.close());

const TODAY = "2026-10-11";

/** What Home should say Yours to keep is, worked out independently from the core rules. */
function expectedKeep(country: "uk" | "lk", periodIn: number, periodOut: number, ytdProfit: number, periodFrom: string) {
  const rules = rulesFor(country);
  const year = rules.taxYearOf(TODAY);
  const yearDays = daysBetween(year.from, year.to) + 1;
  const projected = Math.round((ytdProfit * yearDays) / (daysBetween(year.from, TODAY) + 1));
  const est = rules.estimate(Math.max(0, projected), { year: Number(year.from.slice(0, 4)) });
  const share = ytdProfit > 0 ? Math.round((est.total * (daysBetween(periodFrom, TODAY) + 1)) / yearDays) : 0;
  return { share, keep: periodIn - periodOut - share, yearTax: est.total };
}

describe("Home: the three numbers", () => {
  it("UK: this quarter and the tax year, in − out − tax", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const s = seed(t.db, business.id);
    const c = await s.customer("Kandyan Interiors");
    // This quarter (Q3 from 6 Oct): £1,000 invoice, £400 paid.
    const a = await s.invoice({ customerId: c.id, number: "HS-0001", issueDate: "2026-10-07", dueDate: "2026-10-21", total: 100000, paid: 40000, status: "part_paid" });
    await s.receipt(a.id, 40000, "2026-10-08");
    // Earlier in the tax year: £50,000 still owed and late, £300 received.
    await s.invoice({ customerId: c.id, number: "HS-0002", issueDate: "2026-06-01", dueDate: "2026-07-01", total: 5000000 });
    const old = await s.invoice({ customerId: c.id, number: "HS-0003", issueDate: "2026-05-01", dueDate: "2026-05-15", total: 30000, paid: 30000, status: "paid" });
    await s.receipt(old.id, 30000, "2026-05-10");
    // A draft counts for nothing.
    await s.invoice({ customerId: c.id, status: "draft", issueDate: "2026-10-09", dueDate: "2026-10-23", total: 99999 });
    // Going out: half-business phone £120 this quarter; a £200 bill dated last quarter, due in 4 days.
    await s.expense({ spentOn: "2026-10-09", gross: 12000, bizPct: 50, categoryId: null, payee: "EE" });
    const sup = await s.supplier("Leeds Coworking");
    await s.bill({ supplierId: sup.id, billDate: "2026-10-02", dueDate: "2026-10-15", net: 20000, description: "Desk rent" });

    const q = await api.get("/home");
    expect(q.status).toBe(200);
    expect(q.body.period).toMatchObject({ key: "quarter", from: "2026-10-06", to: "2027-01-05" });
    expect(q.body.periods.map((p: { key: string }) => p.key)).toEqual(["quarter", "year"]);
    expect(q.body.comingIn).toMatchObject({ total: 100000, received: 40000, onTheWay: 60000, late: 5000000, lateCount: 1 });
    expect(q.body.goingOut).toMatchObject({ total: 6000, paid: 6000, toPay: 0, dueSoon: 20000, dueSoonCount: 1 });
    const ytd = (40000 + 30000 + 60000 + 5000000) - (6000 + 20000);
    const e = expectedKeep("uk", 100000, 6000, ytd, "2026-10-06");
    expect(e.share).toBeGreaterThan(0);
    expect(q.body.tax).toMatchObject({ share: e.share, yearEstimate: e.yearTax, yearToDateProfit: ytd, wording: "Estimate · your accountant confirms the final figure", verified: false, label: "Income Tax and NI" });
    expect(q.body.tax.lines.map((l: { label: string }) => l.label)).toContain("Class 4 National Insurance");
    expect(q.body.keep).toBe(e.keep);

    const y = await api.get("/home?period=year");
    expect(y.body.period).toMatchObject({ key: "year", from: "2026-04-06", to: "2027-04-05" });
    expect(y.body.comingIn.total).toBe(40000 + 30000 + 60000 + 5000000);
    expect(y.body.goingOut.total).toBe(26000);
    const ey = expectedKeep("uk", y.body.comingIn.total, 26000, ytd, "2026-04-06");
    expect(y.body.keep).toBe(ey.keep);
    expect(y.body.tax.yearEstimate).toBe(q.body.tax.yearEstimate);

    // The MTD quarter card: Q3 open, Q2's update still due 7 Nov.
    expect(q.body.periodCard).toMatchObject({ kind: "quarter", current: { label: "Q3 2026/27", from: "2026-10-06", due: "2027-02-07", income: 100000, expenses: 6000, profit: 94000 }, previous: { label: "Q2 2026/27", due: "2026-11-07" } });
    expect(q.body.deadlines[0]).toMatchObject({ date: "2026-11-07", label: "Q2 2026/27 update" });
    expect(q.body.deadlines.some((d: { label: string }) => d.label === "Self Assessment payment")).toBe(true);
    expect(q.body.empty).toBe(false);

    // Needs you: the late invoice, the draft, the bill due soon, the expense to sort and the missing UTR.
    const kinds = q.body.needs.map((n: { kind: string }) => n.kind);
    expect(kinds).toEqual(expect.arrayContaining(["late", "draft", "bill", "uncategorised", "tax_id"]));
    const late = q.body.needs.find((n: { kind: string }) => n.kind === "late");
    expect(late.title).toBe("HS-0002 to Kandyan Interiors is 102 days late");
    expect(late.body).toContain("£50,000");
    expect(late.href).toMatch(/^\/app\/in\/invoices\/[0-9a-f-]{36}$/);
    expect(q.body.needs.find((n: { kind: string }) => n.kind === "bill")).toMatchObject({ title: "Leeds Coworking bill due in 4 days", href: expect.stringMatching(/^\/app\/out\/bills\//) });
    expect(q.body.needs.find((n: { kind: string }) => n.kind === "uncategorised")).toMatchObject({ title: "1 expense to sort", href: "/app/out?sort=1" });
    expect(q.body.needs.find((n: { kind: string }) => n.kind === "tax_id").title).toBe("Add your UTR");

    // Adding the UTR clears it.
    await api.patch("/business", { taxId: "1234567890" });
    expect((await api.get("/home")).body.needs.some((n: { kind: string }) => n.kind === "tax_id")).toBe(false);
  });

  it("Sri Lanka: this month and the year of assessment, with the VAT and SSCL card", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "lk");
    const s = seed(t.db, business.id);
    const c = await s.customer("Kandyan Spice Co");
    // October: Rs 118,000 + SSCL tax invoice, Rs 50,000 received.
    const a = await s.invoice({ customerId: c.id, number: "SDS-0220", issueDate: "2026-10-03", dueDate: "2026-11-02", net: 100000_00, sscl: 2500_00, vat: 18450_00, total: 120950_00, paid: 50000_00, status: "part_paid" });
    await s.receipt(a.id, 50000_00, "2026-10-05");
    // September: paid in full.
    const sep = await s.invoice({ customerId: c.id, number: "SDS-0219", issueDate: "2026-09-10", dueDate: "2026-10-10", net: 200000_00, vat: 36000_00, total: 236000_00, paid: 236000_00, status: "paid" });
    await s.receipt(sep.id, 236000_00, "2026-09-25");
    const sup = await s.supplier("Dialog");
    await s.bill({ supplierId: sup.id, billDate: "2026-10-01", dueDate: "2026-10-08", net: 10000_00, vat: 1800_00, description: "Internet" });
    await s.expense({ spentOn: "2026-10-02", gross: 5900_00, vat: 900_00, categoryId: "office", payee: "Cargills" });

    const m = await api.get("/home");
    expect(m.body.period).toMatchObject({ key: "month", from: "2026-10-01", to: "2026-10-31" });
    expect(m.body.periods.map((p: { label: string }) => p.label)).toEqual(["This month", "This year of assessment"]);
    // The numbers leave out SSCL and VAT: payments are split in the invoice's proportions.
    const exTax = (amount: number) => Math.round((amount * 100000_00) / 120950_00);
    expect(m.body.comingIn).toMatchObject({ received: exTax(50000_00), onTheWay: exTax(70950_00), total: exTax(50000_00) + exTax(70950_00) });
    expect(m.body.goingOut).toMatchObject({ paid: 5000_00, toPay: 10000_00, total: 15000_00 });
    const inOct = exTax(50000_00) + exTax(70950_00);
    const ytd = inOct + 200000_00 - 15000_00;
    const e = expectedKeep("lk", inOct, 15000_00, ytd, "2026-10-01");
    expect(m.body.tax.share).toBe(e.share);
    expect(m.body.keep).toBe(e.keep);
    expect(m.body.tax.label).toBe("Income tax");

    const y = await api.get("/home?period=year");
    expect(y.body.period).toMatchObject({ from: "2026-04-01", to: "2027-03-31" });
    expect(y.body.keep).toBe(expectedKeep("lk", ytd + 17700_00, 17700_00, ytd, "2026-04-01").keep);

    // VAT and SSCL: October due 20 Nov; September due 20 Oct.
    expect(m.body.periodCard).toMatchObject({
      kind: "vat-month", title: "VAT and SSCL return",
      current: { label: "October 2026", due: "2026-11-20", outputVat: 18450_00, inputVat: 1800_00 + 900_00, vatPayable: 18450_00 - 2700_00, sscl: 2500_00 },
      previous: { label: "September 2026", due: "2026-10-20", outputVat: 36000_00, daysToDue: 9 },
    });
    expect(m.body.deadlines[0]).toMatchObject({ date: "2026-10-20", label: "September 2026 VAT and SSCL return" });
    // Overdue bill shows in Needs you.
    expect(m.body.needs.find((n: { kind: string }) => n.kind === "bill")).toMatchObject({ title: "Dialog bill 3 days overdue", tone: "late" });

    // No card when not registered.
    await api.patch("/business", { vatRegistered: false, ssclRegistered: false });
    expect((await api.get("/home")).body.periodCard).toBeNull();
  });

  it("an empty business gets first steps, all clear numbers and no tax", async () => {
    const { api } = await signUpWithBusiness(t.app, "lk", { taxId: null, vatRegistered: false, vatNumber: null, ssclRegistered: false });
    const r = await api.get("/home");
    expect(r.body).toMatchObject({ empty: true, keep: 0, tax: { share: 0, yearEstimate: 0 }, periodCard: null });
    expect(r.body.firstSteps.map((s: { id: string; done: boolean }) => [s.id, s.done])).toEqual([["invoice", false], ["expense", false], ["tax-id", false]]);
    expect(r.body.needs.map((n: { kind: string }) => n.kind)).toEqual(["tax_id"]);
    expect(r.body.activity[0].message).toMatch(/set up in Sri Lanka/);
  });

  it("warns when turnover nears the VAT threshold", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const s = seed(t.db, business.id);
    const c = await s.customer();
    await s.invoice({ customerId: c.id, issueDate: "2026-02-01", dueDate: "2026-02-15", total: 7000000, paid: 7000000, status: "paid" });
    await s.invoice({ customerId: c.id, issueDate: "2025-09-01", dueDate: "2025-09-15", total: 9000000, paid: 9000000, status: "paid" }); // over 12 months ago
    const r = await api.get("/home");
    const v = r.body.needs.find((n: { kind: string }) => n.kind === "vat_threshold");
    expect(v.title).toBe("Your turnover is nearing the VAT threshold");
    expect(v.body).toContain("£70,000");
    expect(v.body).toContain("£90,000");
  });

  it("rejects a period that isn't one", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    expect((await api.get("/home?period=week")).status).toBe(400);
  });
});

describe("search", () => {
  it("finds customers, invoices, suppliers, expenses and bills in this business only", async () => {
    const a = await signUpWithBusiness(t.app, "uk");
    const b = await signUpWithBusiness(t.app, "lk");
    const sa = seed(t.db, a.business.id), sb = seed(t.db, b.business.id);
    const ca = await sa.customer("Acme Ltd", { email: "pay@acme.test" });
    await sb.customer("Acme Lanka");
    await sa.invoice({ customerId: ca.id, number: "HS-0042", issueDate: "2026-10-01", dueDate: "2026-10-15", total: 5000 });
    const supA = await sa.supplier("Acme Paper");
    await sa.bill({ supplierId: supA.id, billDate: "2026-10-01", dueDate: "2026-10-30", net: 1000, reference: "AP-77", description: "Paper" });
    await sa.expense({ spentOn: "2026-10-01", gross: 1500, payee: "Acme Cafe" });

    const r = await a.api.get("/search?q=acme");
    expect(r.status).toBe(200);
    const types = r.body.results.map((x: { type: string }) => x.type).sort();
    expect(types).toEqual(["bill", "customer", "expense", "supplier"]);
    expect(r.body.results.every((x: { title: string }) => !x.title.includes("Lanka"))).toBe(true);

    const inv = await a.api.get("/search?q=0042");
    expect(inv.body.results).toEqual([expect.objectContaining({ type: "invoice", title: "HS-0042", href: expect.stringMatching(/^\/app\/in\/invoices\//) })]);
    expect((await b.api.get("/search?q=0042")).body.results).toEqual([]);
    expect((await b.api.get("/search?q=acme")).body.results.map((x: { title: string }) => x.title)).toEqual(["Acme Lanka"]);
    // Wildcards are taken literally.
    expect((await a.api.get("/search?q=%25")).body.results).toEqual([]);
    expect((await a.api.get("/search?q=")).body.results).toEqual([]);
  });
});

describe("notifications", () => {
  it("lists, marks read, marks all read, and keeps businesses apart", async () => {
    const a = await signUpWithBusiness(t.app, "uk");
    const b = await signUpWithBusiness(t.app, "lk");
    await notify(t.db, a.business.id, "HS-0001 is late", { body: "£500 was due 1 Oct", link: "/app/in/invoices?status=late" });
    await notify(t.db, a.business.id, "Payment recorded", { body: "£200 from Acme" });
    await notify(t.db, b.business.id, "September VAT due", { body: "By 20 Oct" });

    const list = await a.api.get("/notifications");
    expect(list.body).toMatchObject({ unread: 2, total: 2 });
    expect((await a.api.get("/notifications/unread-count")).body.unread).toBe(2);
    const id = list.body.items[0].id;
    expect((await a.api.post(`/notifications/${id}/read`)).status).toBe(200);
    expect((await a.api.get("/notifications/unread-count")).body.unread).toBe(1);
    expect((await a.api.get("/notifications?filter=unread")).body.items).toHaveLength(1);
    // Unread again.
    await a.api.post(`/notifications/${id}/read`, { read: false });
    expect((await a.api.get("/notifications/unread-count")).body.unread).toBe(2);

    // The other business can't touch it.
    expect((await b.api.post(`/notifications/${id}/read`)).status).toBe(404);
    expect((await b.api.get("/notifications")).body.items.map((n: { title: string }) => n.title)).toEqual(["September VAT due"]);

    const all = await a.api.post("/notifications/read-all");
    expect(all.body).toEqual({ ok: true, marked: 2 });
    expect((await a.api.get("/notifications")).body.unread).toBe(0);
    expect((await b.api.get("/notifications/unread-count")).body.unread).toBe(1);
    expect((await as(t.app).get("/notifications")).status).toBe(401);
  });
});
