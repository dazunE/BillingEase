import type { OutCategory } from "@billingease/contracts";

/** The categories people pick most often, by the start of their id, in order. */
const COMMON = ["travel", "office", "phone", "premises", "rent", "utilities", "cogs", "advertising", "repairs", "professional", "entertaining", "other"];

/**
 * Business categories for a quick pick: the common ones first, without capital spending (it isn't
 * a cost this year) or ones only for another trade (construction subcontractors).
 */
export function quickCategories(all: OutCategory[]) {
  const rank = (id: string) => { const i = COMMON.findIndex((p) => id.startsWith(p)); return i < 0 ? 99 : i; };
  return all.filter((c) => c.scope === "business" && !c.capital && c.id !== "cis").sort((a, b) => rank(a.id) - rank(b.id));
}
