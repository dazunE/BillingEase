import { desc, eq } from "drizzle-orm";
import { activity, outboxEmails } from "@/db/schema";
import type { Exec } from "./ledger";
import { emailProvider } from "./providers";

/** Adds a line to the "Handled for you" log. */
export async function logActivity(db: Exec, businessId: string, message: string) {
  await db.insert(activity).values({ businessId, message });
}

export async function recentActivity(db: Exec, businessId: string, limit = 8) {
  return db.select().from(activity).where(eq(activity.businessId, businessId)).orderBy(desc(activity.createdAt)).limit(limit);
}

/**
 * Queues an email. With an email provider configured (RESEND_API_KEY) it is
 * delivered by `deliverOutbox` once the surrounding transaction commits, so a
 * rolled-back action never emails anyone. Without one, it's kept in the
 * outbox at /app/outbox. `invoiceId` attaches that invoice as a PDF.
 */
export async function sendEmail(
  db: Exec,
  msg: { businessId: string | null; to: string; subject: string; text: string; link?: string; invoiceId?: string },
) {
  await db.insert(outboxEmails).values({
    businessId: msg.businessId,
    toEmail: msg.to,
    subject: msg.subject,
    bodyText: msg.text,
    link: msg.link ?? null,
    invoiceId: msg.invoiceId ?? null,
    status: emailProvider() ? "queued" : "kept",
  });
}
