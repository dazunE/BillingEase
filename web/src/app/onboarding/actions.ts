"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { businesses } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { today } from "@/lib/dates";
import { appUrl, redirectWithFlash } from "@/lib/flash";
import { createDefaultAccounts } from "@/lib/ledger";
import { seedSampleData } from "@/lib/sample";

export type SetupState = { errors?: Record<string, string> } | undefined;

const KINDS = ["freelancer", "agency", "retail", "trades", "food", "nonprofit", "other"] as const;

const schema = z.object({
  name: z.string().trim().min(1, "What's your business called?").max(80),
  kind: z.enum(KINDS, { message: "Pick the closest match." }),
  sample: z.string().optional(),
});

export async function createBusiness(_prev: SetupState, formData: FormData): Promise<SetupState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  const db = await getDb();
  const [existing] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.ownerId, user.id));
  if (existing) redirectWithFlash("/app", "You're all set up already");

  await db.transaction(async (tx) => {
    const [biz] = await tx.insert(businesses).values({ ownerId: user.id, name: parsed.data.name, kind: parsed.data.kind }).returning();
    await createDefaultAccounts(tx, biz.id);
    if (parsed.data.sample === "on") {
      await seedSampleData(tx, biz.id, { today: today(), appUrl: appUrl(), businessName: biz.name });
    } else {
      await logActivity(tx, biz.id, "Set up your books with a starter list of categories");
    }
  });
  redirectWithFlash("/app", `Welcome to BillingEase, ${user.name.split(" ")[0]}`);
}
