import { desc, eq } from "drizzle-orm";
import { activity, outboxEmails } from "@/db/schema";
import type { Exec } from "./ledger";

/** Adds a line to the "Handled for you" log. */
export async function logActivity(db: Exec, businessId: string, message: string) {
  await db.insert(activity).values({ businessId, message });
}

export async function recentActivity(db: Exec, businessId: string, limit = 8) {
  return db.select().from(activity).where(eq(activity.businessId, businessId)).orderBy(desc(activity.createdAt)).limit(limit);
}

/**
 * Mail transport. In development and until an email provider is configured,
 * messages are stored in the outbox and shown at /app/outbox instead of sent.
 */
export async function sendEmail(
  db: Exec,
  msg: { businessId: string | null; to: string; subject: string; text: string; link?: string },
) {
  await db.insert(outboxEmails).values({ businessId: msg.businessId, toEmail: msg.to, subject: msg.subject, bodyText: msg.text, link: msg.link ?? null });
}
