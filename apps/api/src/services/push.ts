import { PUSH_KINDS, type PushKind } from "@billingease/contracts";
import type { Exec } from "@billingease/db";
import { memberships, notifications, pushDevices } from "@billingease/db/schema";
import { and, inArray, isNull, sql } from "drizzle-orm";
import type { Config } from "../config";

export type PushMessage = { to: string; title: string; body?: string; data: Record<string, unknown>; sound: "default" };
/** What the push service said about one message, in the order sent. */
export type PushTicket = { status: "ok" } | { status: "error"; message?: string; details?: { error?: string } };

/** Something that can actually deliver push notifications. */
export interface PushTransport {
  send(messages: PushMessage[]): Promise<PushTicket[]>;
}

/** Expo's push service, which hands on to Apple and Google. */
class ExpoTransport implements PushTransport {
  constructor(private accessToken: string | null) {}
  async send(messages: PushMessage[]) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", ...(this.accessToken ? { authorization: `Bearer ${this.accessToken}` } : {}) },
      body: JSON.stringify(messages),
    });
    if (!res.ok) throw new Error(`Expo push said ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return ((await res.json()) as { data: PushTicket[] }).data;
  }
}

export function pushTransport(config: Config): PushTransport | null {
  return config.push.enabled ? new ExpoTransport(config.push.accessToken) : null;
}

/** Which kind of notification this is, from where it links (and its words when that's not enough). */
export function kindOf(link: string | null, title: string): PushKind | null {
  const l = link ?? "";
  if (l.startsWith("/app/budgets")) return "budgets";
  if (l.startsWith("/app/check") || l.startsWith("/app/statements") || l.startsWith("/app/capture")) return "drafts";
  if (l.startsWith("/app/accountant") || l.startsWith("/app/practice")) return "accountant";
  if (l.startsWith("/app/out/payroll")) return "payroll";
  if (l.startsWith("/app/keep") || /\b(due|deadline|return|quarter)\b/i.test(title)) return "deadlines";
  if (l.startsWith("/app/in")) return /\blate\b|overdue|remind/i.test(title) ? "late" : "paid";
  return null;
}

/**
 * Sends the notifications made in the last hour that haven't been pushed yet, to the phones of
 * the people they're for (one person, or everyone in the business). Each notification is claimed
 * before sending, so two API instances never push the same one.
 */
export async function deliverPushes(db: Exec, transport: PushTransport, limit = 100) {
  const claimed = await db.update(notifications).set({ pushedAt: new Date() })
    .where(inArray(notifications.id, sql`(select ${notifications.id} from ${notifications} where ${notifications.pushedAt} is null and ${notifications.createdAt} > now() - interval '1 hour' order by ${notifications.createdAt} limit ${limit} for update skip locked)`))
    .returning();
  if (!claimed.length) return 0;
  const businessIds = [...new Set(claimed.map((n) => n.businessId))];
  const members = await db.select({ businessId: memberships.businessId, userId: memberships.userId }).from(memberships).where(inArray(memberships.businessId, businessIds));
  const userIds = [...new Set(members.map((m) => m.userId))];
  const devices = userIds.length ? await db.select().from(pushDevices).where(and(inArray(pushDevices.userId, userIds), isNull(pushDevices.disabledAt))) : [];

  const out: { message: PushMessage; deviceId: string }[] = [];
  for (const n of claimed) {
    const kind = kindOf(n.link, n.title);
    const people = n.userId ? [n.userId] : members.filter((m) => m.businessId === n.businessId).map((m) => m.userId);
    for (const d of devices) {
      if (!people.includes(d.userId)) continue;
      if (kind && !d.kinds.includes(kind)) continue;
      out.push({ deviceId: d.id, message: { to: d.token, title: n.title, body: n.body ?? undefined, sound: "default", data: { link: n.link, businessId: n.businessId, notificationId: n.id } } });
    }
  }
  // Expo takes up to 100 messages a request.
  const sent = new Set<string>();
  for (let i = 0; i < out.length; i += 100) {
    const batch = out.slice(i, i + 100);
    let tickets: Awaited<ReturnType<PushTransport["send"]>>;
    try { tickets = await transport.send(batch.map((b) => b.message)); }
    catch (err) {
      // Expo didn't take it: hand back the notifications that reached no phone yet, so the next
      // run tries them again. One already pushed to some phones stays claimed, so none gets it twice.
      const back = claimed.map((n) => n.id).filter((id) => !sent.has(id));
      if (back.length) await db.update(notifications).set({ pushedAt: null }).where(inArray(notifications.id, back));
      throw err;
    }
    for (const b of batch) sent.add(b.message.data.notificationId as string);
    const gone = batch.filter((_, j) => tickets[j]?.status === "error" && (tickets[j] as { details?: { error?: string } }).details?.error === "DeviceNotRegistered").map((b) => b.deviceId);
    if (gone.length) await db.update(pushDevices).set({ disabledAt: new Date() }).where(inArray(pushDevices.id, gone));
  }
  return out.length;
}

export const ALL_KINDS = [...PUSH_KINDS];

