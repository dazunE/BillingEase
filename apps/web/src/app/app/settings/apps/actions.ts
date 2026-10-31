"use server";

import { apiAccess, type ApiScope } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";

export type TokenState = (NonNullable<FormState> & { token?: string; name?: string }) | undefined;

/** Makes a personal access token. Its value is shown once, here, and never again. */
export async function createToken(_: TokenState, fd: FormData): Promise<TokenState> {
  const v = formValues(fd);
  const scopes = fd.getAll("scopes").filter((s): s is ApiScope => s === "books:read" || s === "books:propose");
  const days = v.expires === "never" ? null : Number(v.expires);
  try {
    const r = await call(apiAccess.createToken, { body: { name: v.name ?? "", scopes, expiresInDays: days as 30 | 90 | 365 | null } });
    revalidatePath("/app/settings/apps");
    return { ok: true, token: r.token, name: r.info.name };
  } catch (err) {
    return failed(err, v);
  }
}

export async function revokeToken(fd: FormData) {
  await call(apiAccess.revokeToken, { params: { id: String(fd.get("id")) }, body: {} });
  revalidatePath("/app/settings/apps");
}

export async function disconnectApp(fd: FormData) {
  await call(apiAccess.revokeApp, { params: { id: String(fd.get("id")) }, body: {} });
  revalidatePath("/app/settings/apps");
}
