"use server";

import { agents } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";
import { checked, failed, formValues, type FormState } from "@/lib/form";

/** Turns an agent on or off and sets its monthly cap (in US dollars; blank = the default). */
export async function saveAgent(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const raw = (v.budget ?? "").replace(/[$,\s]/g, "");
  const dollars = raw === "" ? null : Number(raw);
  if (dollars !== null && (!Number.isFinite(dollars) || dollars < 0 || dollars > 1000)) {
    return { message: "Some details need fixing.", errors: { budget: "Enter dollars between 0 and 1,000, or leave it blank" }, values: v };
  }
  try {
    await call(agents.setAgent, { params: { agent: v.agent }, body: { enabled: checked(v.enabled), monthlyBudgetMicros: dollars === null ? null : Math.round(dollars * 1_000_000) } });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app/settings/ai");
  return { ok: true, message: "Saved." };
}
