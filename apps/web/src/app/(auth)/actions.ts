"use server";

import { auth } from "@billingease/contracts";
import { redirect } from "next/navigation";
import { call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";
import { clearSession, setSession } from "@/lib/session";

/** Only same-site paths, so a crafted link can't send people elsewhere after sign-in. */
function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  if (v.country !== "uk" && v.country !== "lk") return { errors: { country: "Pick where your business is" }, values: v };
  if (v.terms !== "on") return { errors: { terms: "Please agree to the terms to continue" }, values: v };
  try {
    const s = await call(auth.signUp, { body: { name: v.name ?? "", email: v.email ?? "", password: v.password ?? "" }, token: null });
    await setSession(s.token, s.expiresAt);
  } catch (err) {
    return failed(err, { ...v, password: "" });
  }
  redirect(`/setup?country=${v.country}`);
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    const s = await call(auth.signIn, { body: { email: v.email ?? "", password: v.password ?? "" }, token: null });
    await setSession(s.token, s.expiresAt);
  } catch (err) {
    return failed(err, { email: v.email ?? "" });
  }
  redirect(safeNext(v.next, "/app"));
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(auth.forgotPassword, { body: { email: v.email ?? "" }, token: null });
  } catch (err) {
    return failed(err, v);
  }
  return { ok: true, message: "If there's an account with that email, a link to reset the password is on its way. It works for one hour.", values: v };
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  if ((v.password ?? "") !== (v.confirm ?? "")) return { errors: { confirm: "The two passwords don't match" }, values: { token: v.token ?? "" } };
  try {
    const s = await call(auth.resetPassword, { body: { token: v.token ?? "", password: v.password ?? "" }, token: null });
    await setSession(s.token, s.expiresAt);
  } catch (err) {
    return failed(err, { token: v.token ?? "" });
  }
  redirect("/app");
}

export async function signOut() {
  try {
    await call(auth.signOut);
  } catch {
    // Signed out already; clear the cookie anyway.
  }
  await clearSession();
  redirect("/sign-in");
}
