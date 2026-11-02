"use server";

import { people } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";

/** Emails an invitation to open the books as an accountant or office admin. */
export async function invite(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    const r = await call(people.invite, { body: { email: v.email ?? "", role: v.role === "admin" ? "admin" : "accountant" } });
    revalidatePath("/app/settings/people");
    return { ok: true, message: `Invitation sent to ${r.email}. The link works for 14 days.` };
  } catch (err) {
    return failed(err, v);
  }
}

export async function cancelInvite(fd: FormData) {
  await call(people.revokeInvite, { params: { id: String(fd.get("id")) } });
  revalidatePath("/app/settings/people");
}

export async function removeMember(fd: FormData) {
  await call(people.removeMember, { params: { userId: String(fd.get("userId")) } });
  revalidatePath("/app/settings/people");
}
