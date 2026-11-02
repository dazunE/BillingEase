import "server-only";
import { auth, business, type Business, type Me } from "@billingease/contracts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ApiFailure, call } from "./api";
import { BUSINESS_COOKIE, SESSION_COOKIE, TWO_STEP_COOKIE } from "./cookies";

export async function setSession(token: string, expiresAt: string) {
  const jar = await cookies();
  // A new sign-in starts without the last person's business.
  jar.delete(BUSINESS_COOKIE);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt),
  });
}

/** Two-step sign-in is on: keep the ticket (never the password) until the code is in. */
export async function setTwoStep(ticket: string, expiresAt: string, next?: string) {
  (await cookies()).set(TWO_STEP_COOKIE, JSON.stringify({ t: ticket, n: next ?? "" }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt),
  });
}

export async function readTwoStep(): Promise<{ ticket: string; next: string } | null> {
  const raw = (await cookies()).get(TWO_STEP_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { t?: unknown; n?: unknown };
    return typeof v.t === "string" ? { ticket: v.t, next: typeof v.n === "string" ? v.n : "" } : null;
  } catch {
    return null;
  }
}

export async function clearTwoStep() {
  (await cookies()).delete(TWO_STEP_COOKIE);
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(BUSINESS_COOKIE);
}

/** Remembers which business the person is working in, until they sign out or switch. */
export async function chooseBusiness(id: string) {
  (await cookies()).set(BUSINESS_COOKIE, id, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365,
  });
}

/** The signed-in user, or null. Cached for the request. */
export const currentMe = cache(async (): Promise<Me | null> => {
  if (!(await cookies()).has(SESSION_COOKIE)) return null;
  try {
    return await call(auth.me);
  } catch (err) {
    if (err instanceof ApiFailure && err.status === 401) return null;
    throw err;
  }
});

export async function requireMe(): Promise<Me> {
  const me = await currentMe();
  if (!me) redirect("/sign-in");
  return me;
}

/** The user and the business they're working in. No business yet → setup. */
export const requireBusiness = cache(async (): Promise<{ me: Me; business: Business }> => {
  const me = await requireMe();
  if (me.businesses.length === 0) redirect("/setup");
  try {
    return { me, business: await call(business.get) };
  } catch (err) {
    if (err instanceof ApiFailure && (err.code === "pick_business" || err.status === 403)) redirect("/businesses");
    throw err;
  }
});
