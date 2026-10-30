import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { attachments, documentExtractions, proposals } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { checkReading, type Reading } from "../src/agents/capture";
import { drain } from "../src/agents/platform/queue";
import { loadConfig } from "../src/config";
import { fakeModels, text } from "./fake-models";
import { signUpWithBusiness } from "./helpers";
import { homeTestApp, seed } from "./home-helpers";

// The smallest PNG: the bytes only need to look like a photo.
const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082", "hex");

function multipart(filename: string, bytes: Buffer) {
  const boundary = "----be" + Math.random().toString(16).slice(2);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return { body, type: `multipart/form-data; boundary=${boundary}` };
}

const reading = (r: Partial<Reading>): Reading => ({
  kind: "receipt", supplierName: "EE", date: "2026-10-09", dueDate: null, reference: null, currency: "GBP", total: 48, vat: 8, sscl: 0,
  paymentMethod: "Card", categoryId: "office", lines: [], confidence: 95, notes: null, ...r,
});

const UK = { country: "uk" as const, currency: "GBP" as const, vatRegistered: true, ssclRegistered: false, termsDays: 30 };
const LK = { country: "lk" as const, currency: "LKR" as const, vatRegistered: true, ssclRegistered: true, termsDays: 30 };
const base = { today: "2026-10-11", filename: "IMG_2041.jpg", supplierId: null, duplicateOf: null };

describe("checkReading", () => {
  it("makes a UK receipt into an expense, in pence, with VAT", () => {
    const c = checkReading(reading({}), { ...base, business: UK });
    expect(c).toMatchObject({ ok: true, kind: "receipt", confidence: 95, title: "EE, £48" });
    if (!c.ok) return;
    expect(c.payload).toEqual({ spentOn: "2026-10-09", payee: "EE", categoryId: "office", gross: 4800, vat: 800, method: "Card", note: null });
    expect(c.summary).toBe("Read from IMG_2041.jpg: EE, 9 Oct 2026, £48 including £8 VAT.");
  });

  it("keeps VAT in the amount when the business isn't VAT registered, and fills a missing method", () => {
    const c = checkReading(reading({ paymentMethod: null }), { ...base, business: { ...UK, vatRegistered: false } });
    if (!c.ok) throw new Error("expected ok");
    expect(c.payload).toMatchObject({ gross: 4800, vat: 0, method: "Bank transfer" });
    expect(c.fields.checks).toEqual(["You're not VAT registered, so the VAT stays in the amount.", "How it was paid isn't on it: set to Bank transfer. Change it if not."]);
  });

  it("makes a Sri Lankan Tax Invoice into a bill, with SSCL as part of the cost", () => {
    // Rs 100,000 + VAT 18% (Rs 18,000) + SSCL Rs 2,500: total Rs 120,500
    const c = checkReading(reading({
      kind: "bill", supplierName: "Colombo Paper Mart", currency: "LKR", total: 120500, vat: 18000, sscl: 2500, date: "2026-10-02", dueDate: "2026-11-01", reference: "CPM-4471",
      lines: [{ description: "A4 paper, 40 reams", net: 60000, vat: 10800, categoryId: "office" }, { description: "Printing", net: 40000, vat: 7200, categoryId: null }], categoryId: "office",
    }), { ...base, business: LK, filename: "cpm.pdf" });
    if (!c.ok) throw new Error("expected ok");
    expect(c.kind).toBe("bill");
    expect(c.mismatch).toBe(false);
    expect(c.payload).toEqual({
      supplierName: "Colombo Paper Mart", reference: "CPM-4471", billDate: "2026-10-02", dueDate: "2026-11-01", description: null,
      lines: [{ description: "A4 paper, 40 reams", categoryId: "office", net: 6250000, vat: 1080000 }, { description: "Printing", categoryId: "office", net: 4000000, vat: 720000 }],
    });
    expect(c.title).toBe("Colombo Paper Mart bill, Rs 120,500");
    expect(c.summary).toContain("including Rs 18,000 VAT and Rs 2,500 SSCL");
  });

  it("says when the lines don't add up", () => {
    const c = checkReading(reading({ kind: "bill", total: 150, lines: [{ description: "Cards", net: 100, vat: 20, categoryId: "office" }] }), { ...base, business: UK });
    if (!c.ok) throw new Error("expected ok");
    expect(c.mismatch).toBe(true);
    expect(c.confidence).toBe(65);
    expect(c.fields.checks).toContain("The lines add up to £120, not the £150 total.");
  });

  it("turns down what it can't use", () => {
    expect(checkReading(reading({ kind: "not_a_receipt", notes: "a photo of a cat" }), { ...base, business: UK })).toEqual({ ok: false, error: "This doesn't look like a receipt or a bill: a photo of a cat" });
    expect(checkReading(reading({ currency: "USD" }), { ...base, business: UK })).toMatchObject({ ok: false, error: expect.stringContaining("It's in USD") });
    expect(checkReading(reading({ total: null, notes: "faded" }), { ...base, business: UK })).toMatchObject({ ok: false, error: expect.stringContaining("(faded)") });
  });

  it("lowers its confidence for a future date, a possible duplicate and an unknown category", () => {
    const c = checkReading(reading({ date: "2026-12-01", categoryId: "made-up" }), { ...base, business: UK, duplicateOf: "EE, 9 Oct 2026" });
    if (!c.ok) throw new Error("expected ok");
    expect(c.confidence).toBe(30);
    expect(c.payload.categoryId).toBeNull();
    expect(c.fields.checks).toEqual(["The date read is in the future: check it.", "No category picked: it will go to Spending to sort.", "It looks like one you already have: EE, 9 Oct 2026."]);
  });
});

const models = fakeModels(loadConfig({ NODE_ENV: "test" }));
let t: Awaited<ReturnType<typeof homeTestApp>>;
beforeAll(async () => { t = await homeTestApp({ models }); });
afterAll(() => t.close());

async function upload(token: string, businessId: string, filename = "IMG_2041.png", bytes = PNG) {
  const m = multipart(filename, bytes);
  const res = await t.app.inject({ method: "POST", url: "/capture", headers: { authorization: `Bearer ${token}`, "x-business-id": businessId, "content-type": m.type }, payload: m.body });
  return { status: res.statusCode, body: res.json() };
}

describe("Capture", () => {
  it("reads a photo in the background and proposes the expense; approving moves the photo onto it", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk", { vatRegistered: true, vatNumber: "GB123456789" });
    await seed(t.db, business.id);
    models.llm.seen.length = 0;
    models.llm.script.push(text(JSON.stringify(reading({}))));
    const up = await upload(token, business.id);
    expect(up.status).toBe(200);
    expect(up.body).toMatchObject({ status: "queued", filename: "IMG_2041.png", mime: "image/png", proposalId: null });

    expect(await drain(t.app)).toBe(1);
    // The model got the photo itself, and the instruction lists this country's categories.
    const parts = models.llm.seen[0].contents[0].parts!;
    expect(parts[1].inlineData).toMatchObject({ mimeType: "image/png", data: PNG.toString("base64") });
    expect(models.llm.seen[0].system).toContain("office: Phone, internet and office");

    const list = await api.get("/capture");
    expect(list.body.captures[0]).toMatchObject({ status: "done", proposalId: expect.any(String) });
    const p = (await api.get(`/proposals/${list.body.captures[0].proposalId}`)).body;
    expect(p).toMatchObject({ agent: "capture", agentName: "Capture", kind: "expense.create", title: "EE, £48", confidence: 95, sources: [{ kind: "attachment", label: "IMG_2041.png" }] });
    // The photo can be opened from the proposal.
    const file = await t.app.inject({ method: "GET", url: `/out/attachments/${p.sources[0].id}/file`, headers: { authorization: `Bearer ${token}`, "x-business-id": business.id } });
    expect(file.statusCode).toBe(200);

    const ok = await api.post(`/proposals/${p.id}/approve`, {});
    expect(ok.status).toBe(200);
    const expense = await api.get(ok.body.appliedHref.replace("/app", ""));
    expect(expense.body.expense).toMatchObject({ gross: 4800, vat: 800, payee: "EE" });
    expect(expense.body.attachments).toEqual([expect.objectContaining({ filename: "IMG_2041.png", ownerType: "expense" })]);
  });

  it("looks again when the lines don't add up, and uses the second reading", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "lk");
    const bad = reading({ kind: "bill", currency: "LKR", supplierName: "Lanka Hardware", total: 11800, vat: 1800, lines: [{ description: "Tools", net: 9000, vat: 1800, categoryId: "repairs" }], categoryId: "repairs" });
    const good = { ...bad, lines: [{ description: "Tools", net: 10000, vat: 1800, categoryId: "repairs" }] };
    models.llm.seen.length = 0;
    models.llm.script.push(text(JSON.stringify(bad)), text(JSON.stringify(good)));
    await upload(token, business.id, "lanka-hw.pdf", Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(20)]));
    await drain(t.app);
    expect(models.llm.seen).toHaveLength(2);
    expect(models.llm.seen[1].contents.at(-1)!.parts![0].text).toContain("don't add up");
    const [p] = await t.db.select().from(proposals).where(eq(proposals.businessId, business.id));
    expect(p).toMatchObject({ kind: "bill.create", title: "Lanka Hardware bill, Rs 11,800" });
    expect((p.payload.lines as { net: number }[])[0].net).toBe(1000000);
    expect((await api.get("/agents/runs")).body.runs).toHaveLength(2);
  });

  it("says plainly when it can't be read, and can try again", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk");
    models.llm.script.push(text(JSON.stringify(reading({ kind: "not_a_receipt", notes: "a photo of a cat" }))));
    const up = await upload(token, business.id, "cat.png");
    await drain(t.app);
    expect((await api.get("/capture")).body.captures[0]).toMatchObject({ status: "failed", error: "This doesn't look like a receipt or a bill: a photo of a cat" });
    models.llm.script.push(text(JSON.stringify(reading({ vat: 0 }))));
    const retry = await api.post(`/capture/${up.body.id}/retry`);
    expect(retry.body.status).toBe("queued");
    await drain(t.app);
    expect((await api.get("/capture")).body.captures[0].status).toBe("done");
    expect((await api.post(`/capture/${up.body.id}/retry`)).status).toBe(409);
  });

  it("takes only photos and PDFs, keeps uploads per business, and respects the switch", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk");
    expect((await upload(token, business.id, "notes.txt", Buffer.from("hello"))).status).toBe(415);
    const other = await signUpWithBusiness(t.app, "uk");
    const up = await upload(token, business.id);
    expect((await other.api.post(`/capture/${up.body.id}/retry`)).status).toBe(404);
    expect((await other.api.get("/capture")).body.captures).toEqual([]);
    await api.put("/agents/capture", { enabled: false });
    expect((await upload(token, business.id)).status).toBe(409);
    // The queued one is read as usual; leave the queue empty for the next test.
    models.llm.script.push(text(JSON.stringify(reading({ vat: 0 }))));
    await drain(t.app);
    const [x] = await t.db.select().from(documentExtractions).where(eq(documentExtractions.id, up.body.id));
    expect(x.status).toBe("failed");
    expect(x.error).toMatch(/turned off/);
    models.llm.script.length = 0;
    const files = await t.db.select().from(attachments).where(eq(attachments.businessId, business.id));
    expect(files.every((f) => f.ownerType === "capture")).toBe(true);
  });
});

describe("Capture without Vertex AI", () => {
  it("says it isn't set up", async () => {
    const t2 = await homeTestApp({ models: null });
    try {
      const { business, token } = await signUpWithBusiness(t2.app, "uk");
      const m = multipart("r.png", PNG);
      const res = await t2.app.inject({ method: "POST", url: "/capture", headers: { authorization: `Bearer ${token}`, "x-business-id": business.id, "content-type": m.type }, payload: m.body });
      expect(res.statusCode).toBe(503);
      expect(res.json().error.code).toBe("ai_not_set_up");
    } finally {
      await t2.close();
    }
  });
});
