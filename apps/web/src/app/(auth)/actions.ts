"use server";

import { auth } from "@billingease/contracts";
import { redirect } from "next/navigation";
import { isCty } from "@/components/auth/country";
import { failed, formValues, type FormState } from "@/lib/form";
import { ApiFailure, call } from "@/lib/api";
import { clearSession, clearTwoStep, readTwoStep, setSession, setTwoStep } from "@/lib/session";

/** Only same-site paths, so a crafted link can't send people elsewhere after sign-in. */
function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  // Someone accepting an invitation joins those books: no country of their own yet.
  const joining = !!v.next && v.next.startsWith("/invite/");
  if (!joining && !isCty(v.country)) return { errors: { country: "Pick where your business is" }, values: v };
  if (v.terms !== "on") return { errors: { terms: "Please agree to the terms to continue" }, values: v };
  try {
    const s = await call(auth.signUp, { body: { name: v.name ?? "", email: v.email ?? "", password: v.password ?? "" }, token: null });
    await setSession(s.token, s.expiresAt);
  } catch (err) {
    return failed(err, { ...v, password: "" });
  }
  redirect(joining ? safeNext(v.next, "/setup") : `/setup?country=${v.country}`);
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  let twoStep = false;
  try {
    const s = await call(auth.signIn, { body: { email: v.email ?? "", password: v.password ?? "" }, token: null });
    if ("ticket" in s) {
      await setTwoStep(s.ticket, s.expiresAt, safeNext(v.next, "/app"));
      twoStep = true;
    } else {
      await setSession(s.token, s.expiresAt);
    }
  } catch (err) {
    return failed(err, { email: v.email ?? "" });
  }
  redirect(twoStep ? "/sign-in/code" : safeNext(v.next, "/app"));
}

/** The second step: the code from the authenticator app, or a backup code. */
export async function signInCode(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const pending = await readTwoStep();
  if (!pending) return { message: "That took too long. Sign in again.", errors: { _expired: "1" }, values: {} };
  const code = (v.code ?? "").trim();
  const backup = v.backup === "1";
  if (backup ? code.replace(/[^0-9a-z]/gi, "").length !== 8 : !/^\d{6}$/.test(code.replace(/\s/g, ""))) {
    return { errors: { code: backup ? "Backup codes are 8 letters and numbers." : "Enter the 6 digits from your app." }, values: { backup: v.backup ?? "" } };
  }
  try {
    const s = await call(auth.twoStep, { body: { ticket: pending.ticket, code }, token: null });
    await setSession(s.token, s.expiresAt);
    await clearTwoStep();
  } catch (err) {
    if (err instanceof ApiFailure && err.status === 401) {
      await clearTwoStep();
      return { message: err.message, errors: { _expired: "1" }, values: {} };
    }
    return failed(err, { backup: v.backup ?? "" });
  }
  redirect(safeNext(pending.next, "/app"));
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
  let twoStep = false;
  try {
    const s = await call(auth.resetPassword, { body: { token: v.token ?? "", password: v.password ?? "" }, token: null });
    if ("ticket" in s) {
      await setTwoStep(s.ticket, s.expiresAt, "/app");
      twoStep = true;
    } else {
      await setSession(s.token, s.expiresAt);
    }
  } catch (err) {
    return failed(err, { token: v.token ?? "" });
  }
  redirect(twoStep ? "/sign-in/code" : "/app");
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
