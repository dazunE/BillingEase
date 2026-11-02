import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

describe("kinds of invoice", () => {
  it("bills time and materials, with the markup worked out from the cost", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk", { vatRegistered: true, vatNumber: "GB123456789" });
    const c = (await api.post("/customers", { name: "Kirkstall Brewing Co" })).body;
    const r = await api.post("/invoices", {
      customerId: c.id, issueDate: "2026-10-08", billing: "time_materials",
      lines: [
        { section: "time", description: "Replace boiler", workDate: "2026-10-06", person: "Ellie", quantityMilli: 7500, unitPrice: 6000, vatRateId: "std" },
        // unitPrice is ignored: £10 cost + 20% = £12.
        { section: "materials", description: "Copper pipe", quantityMilli: 4000, unitPrice: 1, costPrice: 1000, markupBps: 2000, vatRateId: "std" },
      ],
    });
    expect(r.status).toBe(200);
    expect(r.body.billing).toBe("time_materials");
    expect(r.body.lines[0]).toMatchObject({ section: "time", workDate: "2026-10-06", person: "Ellie", net: 45000, costPrice: null, markupBps: null });
    expect(r.body.lines[1]).toMatchObject({ section: "materials", unitPrice: 1200, costPrice: 1000, markupBps: 2000, net: 4800 });
    expect(r.body).toMatchObject({ net: 49800, vat: 9960, total: 59760 });
    expect((await api.post(`/invoices/${r.body.id}/issue`, {})).status).toBe(200);
    const pdf = await t.app.inject({ method: "GET", url: `/invoices/${r.body.id}/pdf`, headers: { authorization: `Bearer ${token}`, "x-business-id": business.id } });
    expect(pdf.statusCode).toBe(200);
    expect((await PDFDocument.load(pdf.rawPayload)).getPageCount()).toBe(1);

    // A credit note keeps the kind and the sections.
    const cn = await api.post(`/invoices/${r.body.id}/credit-notes`, { full: true });
    const cnd = (await api.get(`/invoices/${cn.body.id}`)).body;
    expect(cnd.billing).toBe("time_materials");
    expect(cnd.lines.map((l: { section: string }) => l.section)).toEqual(["time", "materials"]);
  });

  it("bills a fixed price, and refuses a kind or markup it doesn't know", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "lk");
    const c = (await api.post("/customers", { name: "Kandyan Spice Co" })).body;
    const r = await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-08", billing: "fixed", lines: [{ description: "Website redesign\nFive pages and a blog", quantityMilli: 1000, unitPrice: 24000000, vatRateId: "std" }] });
    expect(r.status).toBe(200);
    expect(r.body.billing).toBe("fixed");
    const pdf = await t.app.inject({ method: "GET", url: `/invoices/${r.body.id}/pdf`, headers: { authorization: `Bearer ${token}`, "x-business-id": business.id } });
    expect(pdf.statusCode).toBe(200);
    expect((await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-08", billing: "hourly", lines: [] })).status).toBe(400);
    expect((await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-08", lines: [{ description: "x", quantityMilli: 1000, unitPrice: 100, costPrice: 100, markupBps: -5 }] })).status).toBe(400);
    // Left out, an invoice is billed by items, as before.
    expect((await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-08", lines: [{ description: "Labels", quantityMilli: 1000, unitPrice: 100 }] })).body.billing).toBe("items");
  });
});
