"use server";

import { people } from "@billingease/contracts";
import { redirect } from "next/navigation";
import { ApiFailure, call } from "@/lib/api";
import { chooseBusiness } from "@/lib/session";

export type AcceptState = { message?: string } | undefined;

/** Accepts the invitation as whoever is signed in, then opens those books. */
export async function accept(_: AcceptState, fd: FormData): Promise<AcceptState> {
  const token = String(fd.get("token") ?? "");
  let id: string;
  try {
    id = (await call(people.acceptInvite, { params: { token } })).businessId;
  } catch (err) {
    if (err instanceof ApiFailure) return { message: err.message };
    throw err;
  }
  await chooseBusiness(id);
  redirect("/app");
}
