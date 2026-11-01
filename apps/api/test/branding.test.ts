import { deflateSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpWithBusiness, testApp } from "./helpers";

let t: Awaited<ReturnType<typeof testApp>>;
beforeAll(async () => { t = await testApp(); });
afterAll(() => t.close());

/** A small solid-colour PNG, made by hand so the test needs no image library. */
function png(w: number, h: number, rgb = [15, 118, 110]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

describe("invoice branding", () => {
  it("saves the layout, typeface, colour and footer", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const before = (await api.get("/business")).body;
    expect(before).toMatchObject({ template: "classic", font: "sans", footer: null, hasLogo: false, logoVersion: null });
    const r = await api.patch("/business", { template: "modern", font: "serif", accent: "#0F766E", footer: "Registered in England 01234567" });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ template: "modern", font: "serif", accent: "#0F766E", footer: "Registered in England 01234567" });
    expect((await api.patch("/business", { template: "fancy" })).status).toBe(400);
    expect((await api.patch("/business", { accent: "teal" })).status).toBe(400);
  });

  it("takes a PNG logo, refuses other files, serves it back and removes it", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "uk");
    const up = await api.put("/business/logo", { image: `data:image/png;base64,${png(120, 40).toString("base64")}` });
    expect(up.status).toBe(200);
    expect(up.body).toMatchObject({ hasLogo: true });
    expect(up.body.logoVersion).toBeTruthy();
    expect(up.body).not.toHaveProperty("logoKey");

    const img = await t.app.inject({ method: "GET", url: "/business/logo", headers: { authorization: `Bearer ${token}`, "x-business-id": business.id } });
    expect(img.statusCode).toBe(200);
    expect(img.headers["content-type"]).toBe("image/png");

    const gif = Buffer.from("GIF89a\x01\x00\x01\x00", "binary").toString("base64");
    expect((await api.put("/business/logo", { image: gif })).status).toBe(415);
    const broken = Buffer.concat([png(10, 10).subarray(0, 20), Buffer.alloc(40)]).toString("base64");
    expect((await api.put("/business/logo", { image: broken })).status).toBe(400);
    const big = Buffer.concat([png(20, 20), Buffer.alloc(1024 * 1024)]).toString("base64");
    expect((await api.put("/business/logo", { image: big })).status).toBe(400);

    const gone = await api.del("/business/logo");
    expect(gone.body).toMatchObject({ hasLogo: false, logoVersion: null });
    const none = await t.app.inject({ method: "GET", url: "/business/logo", headers: { authorization: `Bearer ${token}`, "x-business-id": business.id } });
    expect(none.statusCode).toBe(404);
  });

  it("draws invoices, quotes and credit notes in every layout and typeface, and brands the email", async () => {
    const { api, business, token } = await signUpWithBusiness(t.app, "lk");
    await api.put("/business/logo", { image: png(200, 60).toString("base64") });
    const c = (await api.post("/customers", { name: "Kandyan Spice Co", email: "accounts@kandyan.example" })).body;
    const inv = (await api.post("/invoices", { customerId: c.id, issueDate: "2026-10-08", lines: [{ description: "Packaging design", quantityMilli: 1000, unitPrice: 6400000 }] })).body;
    const q = (await api.post("/quotes", { customerId: c.id, issueDate: "2026-10-08", lines: [{ description: "Labels", quantityMilli: 1000, unitPrice: 1000000 }] })).body;
    const get = (url: string) => t.app.inject({ method: "GET", url, headers: { authorization: `Bearer ${token}`, "x-business-id": business.id } });
    for (const template of ["classic", "modern", "minimal"]) {
      for (const font of ["sans", "serif", "mono"]) {
        await api.patch("/business", { template, font, accent: font === "mono" ? "#F2C94C" : "#0F766E", footer: "Serendib Design Studio · PV 00012345" });
        for (const url of [`/invoices/${inv.id}/pdf`, `/quotes/${q.id}/pdf`]) {
          const res = await get(url);
          expect(res.statusCode, `${template} ${font} ${url}`).toBe(200);
          expect((await PDFDocument.load(res.rawPayload)).getPageCount()).toBe(1);
        }
      }
    }
    const sent = await api.post(`/invoices/${inv.id}/issue`, { email: true });
    expect(sent.status).toBe(200);
    const mail = t.sent.at(-1)!;
    expect(mail.html).toContain("cid:logo");
    expect(mail.html).toContain("#F2C94C");
    expect(mail.html).toContain("PV 00012345");
    expect(mail.inline).toHaveLength(1);
    expect(mail.inline![0]).toMatchObject({ contentType: "image/png", contentId: "logo" });
    expect(mail.attachments.map((a) => a.contentType)).toEqual(["application/pdf"]);
    const cn = await api.post(`/invoices/${inv.id}/credit-notes`, { full: true });
    expect((await get(`/invoices/${cn.body.id}/pdf`)).statusCode).toBe(200);
  });
});
