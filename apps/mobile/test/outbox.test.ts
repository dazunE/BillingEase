import { describe, expect, it } from "vitest";
import { newKey, Outbox, type Queued, type Store } from "../src/lib/outbox";

const memory = (): Store & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, async get(k) { return data.get(k) ?? null; }, async set(k, v) { if (v === null) data.delete(k); else data.set(k, v); } };
};
const item = (id: string, label = id): Queued => ({ id, kind: "call", name: "createExpense", body: { payee: label }, businessId: "b1", label, at: "2026-10-11T09:00:00Z" });

describe("the outbox", () => {
  it("keeps writes on the phone, in order, across restarts", async () => {
    const store = memory();
    const a = new Outbox(store, "be.outbox.u1");
    await a.add(item("1")); await a.add(item("2"));
    const b = new Outbox(store, "be.outbox.u1");
    expect((await b.load()).map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("sends oldest first, and stops at a lost connection without losing the rest", async () => {
    const box = new Outbox(memory(), "k");
    await box.add(item("1")); await box.add(item("2")); await box.add(item("3"));
    const seen: string[] = [];
    const r = await box.flush(async (i) => { seen.push(i.id); if (i.id === "2") throw { offline: true }; });
    expect(r).toEqual({ sent: 1, failed: 0 });
    expect(seen).toEqual(["1", "2"]);
    expect(box.list().map((i) => i.id)).toEqual(["2", "3"]);
    await box.flush(async () => {});
    expect(box.list()).toHaveLength(0);
  });

  it("keeps a refused write with its reason, carries on, and can try it again or let it go", async () => {
    const box = new Outbox(memory(), "k");
    await box.add(item("1")); await box.add(item("2"));
    const r = await box.flush(async (i) => { if (i.id === "1") throw { message: "Pick a category" }; });
    expect(r).toEqual({ sent: 1, failed: 1 });
    expect(box.failed()).toMatchObject([{ id: "1", error: "Pick a category" }]);
    expect(box.waiting()).toHaveLength(0);
    // A failed item isn't sent again by itself…
    let tried = 0;
    await box.flush(async () => { tried++; });
    expect(tried).toBe(0);
    // …only after Try again.
    await box.retry("1");
    await box.flush(async () => { tried++; });
    expect(tried).toBe(1);
    await box.add(item("3")); await box.remove("3");
    expect(box.list()).toHaveLength(0);
  });

  it("runs one flush at a time", async () => {
    const box = new Outbox(memory(), "k");
    await box.add(item("1"));
    let sends = 0;
    const slow = async () => { sends++; await new Promise((r) => setTimeout(r, 20)); };
    await Promise.all([box.flush(slow), box.flush(slow)]);
    expect(sends).toBe(1);
  });

  it("tells listeners, and clears storage when empty", async () => {
    const store = memory();
    const box = new Outbox(store, "k");
    const counts: number[] = [];
    box.subscribe((items) => counts.push(items.length));
    await box.add(item("1"));
    await box.flush(async () => {});
    expect(counts.at(-1)).toBe(0);
    expect(store.data.has("k")).toBe(false);
  });

  it("makes keys the API accepts", () => {
    const k = newKey();
    expect(k).toMatch(/^[A-Za-z0-9_-]{8,100}$/);
    expect(newKey()).not.toBe(k);
  });
});
