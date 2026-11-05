import type { BudgetStatus } from "@billingease/contracts";
import { describe, expect, it } from "vitest";
import { leftAfter, suggest } from "../src/lib/budgets";

const travel: BudgetStatus = {
  id: "b1", kind: "category", categoryId: "travel", name: "Travel", official: null, amount: 15000, actual: 6000, extra: 0,
  pct: 40, pctWithExtra: 40, lastMonth: 9000, projected: 16909, state: "fast", isGoal: false,
};
const fmt = (n: number) => `£${n / 100}`;

describe("what's left while recording", () => {
  it("says what's left before an amount is typed", () => {
    expect(leftAfter(travel, 0, fmt)).toMatchObject({ text: "Travel: £90 left of £150 this month", tone: "ok", before: 40 });
  });
  it("turns amber from 80% and red when it goes over", () => {
    expect(leftAfter(travel, 6500, fmt)).toMatchObject({ text: "After this, £25 left of £150 for Travel", tone: "warn", after: 83 });
    expect(leftAfter(travel, 10000, fmt)).toMatchObject({ text: "This takes Travel to £160, £10 over its £150 budget", tone: "late", after: 100 });
  });
  it("has nothing to say without a category budget", () => {
    expect(leftAfter(undefined, 100, fmt)).toBeNull();
    expect(leftAfter({ ...travel, kind: "spending" }, 100, fmt)).toBeNull();
  });
});

describe("suggested limits", () => {
  it("round up to a tidy amount", () => {
    expect(suggest(9040, "GBP")).toBe(10000);
    expect(suggest(123_456, "GBP")).toBe(130_000);
    expect(suggest(1_234_500, "LKR")).toBe(1_300_000);
    expect(suggest(0, "GBP")).toBe(1000);
  });
});
