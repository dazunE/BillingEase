"use server";

import { auth } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiFailure, call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";

const PAGE = "/app/settings/sign-in";

export async function savePassword(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  if ((v.password ?? "") !== (v.confirm ?? "")) return { errors: { confirm: "The two passwords don't match" } };
  try {
    if (v.mode === "set") await call(auth.setPassword, { body: { password: v.password ?? "" } });
    else await call(auth.changePassword, { body: { current: v.current ?? "", password: v.password ?? "" } });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(PAGE);
  return { ok: true, message: v.mode === "set" ? "Password set. You can now sign in with it too." : "Password changed." };
}

export async function disconnectGoogle() {
  try {
    await call(auth.unlinkGoogle);
  } catch (err) {
    if (err instanceof ApiFailure) redirect(`${PAGE}?google=${err.code}`);
    throw err;
  }
  redirect(`${PAGE}?google=disconnected`);
}
