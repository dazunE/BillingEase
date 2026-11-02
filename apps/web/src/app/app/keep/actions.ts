"use server";

import { books } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";

/** Marks a quarter, VAT period or tax year as sent, which locks it. */
export async function lockPeriod(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  if (v.confirm !== "on") return { errors: { confirm: "Tick to confirm the figures were sent" }, values: v };
  try {
    const r = await call(books.lockPeriod, { body: { from: v.from ?? "", to: v.to ?? "", reference: v.reference || null } });
    revalidatePath("/app/keep", "layout");
    return { ok: true, message: `${r.label} marked as sent and locked.` };
  } catch (err) {
    return failed(err, v);
  }
}
