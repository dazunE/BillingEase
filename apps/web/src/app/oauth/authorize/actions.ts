"use server";

import { apiAccess, AuthorizeParams } from "@billingease/contracts";
import { redirect } from "next/navigation";
import { call } from "@/lib/api";

/** The person's answer on the consent screen: back to the app with a code, or with a refusal. */
export async function decide(fd: FormData) {
  const params = AuthorizeParams.parse(Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && k in AuthorizeParams.shape)));
  const businessId = fd.get("businessId");
  const { redirect: to } = await call(apiAccess.authorizeDecide, {
    body: { ...params, allow: fd.get("allow") === "yes", ...(typeof businessId === "string" && businessId ? { businessId } : {}) },
  });
  redirect(to);
}
