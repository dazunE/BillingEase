"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { redirectWithFlash } from "@/lib/flash";
import { settingsSchema, updateBusinessSettings } from "@/lib/ops-keep";

export type SettingsState = { errors?: Record<string, string>; values?: Record<string, string> } | undefined;

export async function saveSettingsAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { business, db } = await requireBusiness();
  const values = {
    name: String(formData.get("name") ?? ""),
    invoicePrefix: String(formData.get("invoicePrefix") ?? ""),
    taxRatePct: String(formData.get("taxRatePct") ?? ""),
  };
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { errors, values };
  }
  await db.transaction((tx) => updateBusinessSettings(tx, business.id, parsed.data));
  revalidatePath("/app", "layout");
  redirectWithFlash("/app/settings", "Settings saved");
}
