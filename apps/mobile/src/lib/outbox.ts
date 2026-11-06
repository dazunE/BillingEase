import type { AppEndpointName } from "@billingease/contracts";

/**
 * Writes made without signal wait here, on the phone, in the order they were made. Each carries
 * its own Idempotency-Key, so sending it again after a dropped connection never saves it twice.
 * Pure logic: storage and sending are passed in, so it's tested without a phone.
 */

/** The writes that can wait for signal. Anything else needs a connection there and then. */
export const QUEUEABLE = ["createExpense", "recordPayment", "categoriseExpense", "payBill", "remind", "payPayrollDue", "approve", "reject", "markRead"] as const satisfies readonly AppEndpointName[];
export type Queueable = (typeof QUEUEABLE)[number];

export type QueuedCall = {
  id: string;
  kind: "call";
  name: Queueable;
  params?: Record<string, string>;
  body?: unknown;
  businessId: string;
  /** What it is, in words: "£24.50 to Leeds Art Supplies". */
  label: string;
  at: string;
  /** When the server said no (not a lost connection): why. It waits for the person to decide. */
  error?: string;
};
/** A receipt photo taken offline, kept in the app's files until it can be sent to be read. */
export type QueuedUpload = Omit<QueuedCall, "kind" | "name"> & { kind: "upload"; name: "capture"; file: { uri: string; name: string; type: string } };
export type Queued = QueuedCall | QueuedUpload;

export type Store = { get(key: string): Promise<string | null>; set(key: string, value: string | null): Promise<void> };
/** Sends one item. Throws { offline: true } when there's no connection, or { message } when refused. */
export type Sender = (item: Queued) => Promise<void>;

export class Outbox {
  private items: Queued[] = [];
  private loaded = false;
  private flushing: Promise<{ sent: number; failed: number }> | null = null;
  private listeners = new Set<(items: Queued[]) => void>();

  constructor(private store: Store, private key: string) {}

  async load() {
    if (this.loaded) return this.items;
    try { this.items = JSON.parse((await this.store.get(this.key)) ?? "[]") as Queued[]; } catch { this.items = []; }
    this.loaded = true;
    this.emit();
    return this.items;
  }

  list() { return this.items; }
  waiting() { return this.items.filter((i) => !i.error); }
  failed() { return this.items.filter((i) => !!i.error); }

  subscribe(fn: (items: Queued[]) => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  async add(item: Queued) {
    await this.load();
    this.items = [...this.items, item];
    await this.save();
  }

  async remove(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    await this.save();
  }

  /** Clear an item's error so the next flush tries it again. */
  async retry(id: string) {
    this.items = this.items.map((i) => (i.id === id ? { ...i, error: undefined } : i));
    await this.save();
  }

  /**
   * Sends what's waiting, oldest first. Stops at the first lost connection (the rest keep their
   * order); a refusal is kept with its reason and the rest carry on. One flush at a time.
   */
  flush(send: Sender): Promise<{ sent: number; failed: number }> {
    if (this.flushing) return this.flushing;
    this.flushing = (async () => {
      await this.load();
      let sent = 0, failed = 0;
      for (const item of [...this.items]) {
        if (item.error) continue;
        try {
          await send(item);
          this.items = this.items.filter((i) => i.id !== item.id);
          sent++;
        } catch (e) {
          if ((e as { offline?: boolean }).offline) break;
          this.items = this.items.map((i) => (i.id === item.id ? { ...i, error: (e as { message?: string }).message ?? "BillingEase couldn’t save this." } : i));
          failed++;
        }
        await this.save();
      }
      return { sent, failed };
    })().finally(() => { this.flushing = null; });
    return this.flushing;
  }

  private async save() {
    await this.store.set(this.key, this.items.length ? JSON.stringify(this.items) : null);
    this.emit();
  }

  private emit() { for (const fn of this.listeners) fn(this.items); }
}

/** A random key for one write: the outbox item's id and its Idempotency-Key. */
export function newKey(rand: () => number = Math.random) {
  const hex = () => Math.floor(rand() * 0x10000).toString(16).padStart(4, "0");
  return `m-${hex()}${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}
