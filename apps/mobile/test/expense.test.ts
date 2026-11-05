import { describe, expect, it } from "vitest";
import { quickCategories } from "../src/lib/categories";
import { bodyFrom, draftFrom } from "../src/lib/expense";

describe("an expense from a draft", () => {
  const read = { payee: "Ryman Stationery", gross: 2393, vat: 399, spentOn: "2026-10-10", categoryId: "office", method: "Card" };
  it("keeps what was read, as text to edit", () => {
    const d = draftFrom(read, "GBP", "2026-10-11");
    expect(d).toMatchObject({ payee: "Ryman Stationery", gross: "23.93", vat: "3.99", spentOn: "2026-10-10", categoryId: "office" });
  });
  it("sends VAT only for a VAT-registered business", () => {
    const d = draftFrom(read, "GBP", "2026-10-11");
    expect(bodyFrom(d, "GBP", true)).toMatchObject({ gross: 2393, vat: 399 });
    expect(bodyFrom(d, "GBP", false)).toMatchObject({ gross: 2393, vat: 0 });
  });
  it("isn't ready without who and how much, or with VAT over the total", () => {
    const d = draftFrom(read, "GBP", "2026-10-11");
    expect(bodyFrom({ ...d, payee: " " }, "GBP", true)).toBeNull();
    expect(bodyFrom({ ...d, gross: "" }, "GBP", true)).toBeNull();
    expect(bodyFrom({ ...d, vat: "30" }, "GBP", true)).toBeNull();
  });
  it("starts on the books' today when the draft has no date", () => {
    expect(draftFrom({ payee: "X", gross: 100 }, "LKR", "2026-10-11").spentOn).toBe("2026-10-11");
  });
});

describe("quick categories", () => {
  const c = (id: string, extra = {}) => ({ id, name: id, official: id, allowable: true, scope: "business" as const, capital: false, ...extra });
  it("puts common ones first and leaves out capital and other trades", () => {
    const list = quickCategories([c("cogs"), c("cis"), c("capital", { capital: true }), c("office"), c("travel"), c("p-repairs", { scope: "property" as const })]);
    expect(list.map((x) => x.id)).toEqual(["travel", "office", "cogs"]);
  });
});
