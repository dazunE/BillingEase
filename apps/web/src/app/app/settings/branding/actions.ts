"use server";

import { business } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";
import { blankToNull, failed, formValues, type FormState } from "@/lib/form";

export async function saveBranding(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(business.update, {
      body: {
        template: v.template as "classic",
        font: v.font as "sans",
        accent: (v.accent ?? "").toUpperCase(),
        footer: blankToNull(v.footer),
      },
    });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: "Saved. Your invoices, quotes and credit notes now use this look, including ones you download again.", values: v };
}
