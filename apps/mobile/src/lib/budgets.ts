import type { BudgetStatus } from "@billingease/contracts";

export type Tone = "ok" | "warn" | "late";

/**
 * The line shown while recording an expense: what a category's budget has left, and what this
 * expense does to it. Null when the category has no budget.
 */
export function leftAfter(b: BudgetStatus | undefined, adding: number, fmt: (minor: number) => string): { text: string; tone: Tone; before: number; after: number } | null {
  if (!b || b.kind !== "category") return null;
  const after = b.actual + Math.max(0, adding);
  const pct = (n: number) => (b.amount > 0 ? Math.min(100, Math.round((n / b.amount) * 100)) : 0);
  const tone: Tone = after > b.amount ? "late" : after >= b.amount * 0.8 ? "warn" : "ok";
  let text: string;
  if (adding <= 0) text = b.actual <= b.amount ? `${b.name}: ${fmt(b.amount - b.actual)} left of ${fmt(b.amount)} this month` : `${b.name}: ${fmt(b.actual - b.amount)} over its ${fmt(b.amount)} budget`;
  else if (after > b.amount) text = `This takes ${b.name} to ${fmt(after)}, ${fmt(after - b.amount)} over its ${fmt(b.amount)} budget`;
  else text = `After this, ${fmt(b.amount - after)} left of ${fmt(b.amount)} for ${b.name}`;
  return { text, tone, before: pct(b.actual), after: pct(after) };
}

/** A suggested limit: last month (or this month's pace), rounded up to a tidy amount. */
export function suggest(minor: number, currency: string) {
  const step = currency === "LKR" ? (minor > 10_000_000 ? 5_000_00 : 1_000_00) : minor > 100_000 ? 100_00 : 10_00;
  return Math.max(step, Math.ceil(minor / step) * step);
}
