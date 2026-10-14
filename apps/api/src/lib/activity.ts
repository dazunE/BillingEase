import { activity, notifications } from "@billingease/db/schema";
import type { Exec } from "@billingease/db";

/** Adds a line to the business's activity list ("Recent activity" on Home). */
export async function logActivity(db: Exec, businessId: string, message: string, opts: { actorId?: string | null; link?: string | null } = {}) {
  await db.insert(activity).values({ businessId, message, actorId: opts.actorId ?? null, link: opts.link ?? null });
}

export async function notify(db: Exec, businessId: string, title: string, opts: { body?: string; link?: string; userId?: string | null } = {}) {
  await db.insert(notifications).values({ businessId, title, body: opts.body ?? null, link: opts.link ?? null, userId: opts.userId ?? null });
}
