import "server-only";
import { auth, business, type Business, type Me } from "@billingease/contracts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ApiFailure, call } from "./api";
import { BUSINESS_COOKIE, SESSION_COOKIE } from "./cookies";

export async function setSession(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt),
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(BUSINESS_COOKIE);
}

export async function chooseBusiness(id: string) {
  (await cookies()).set(BUSINESS_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
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
