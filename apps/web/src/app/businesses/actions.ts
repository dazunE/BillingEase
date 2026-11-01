"use server";

import { redirect } from "next/navigation";
import { requireMe, chooseBusiness } from "@/lib/session";

/** Switches to one of the person's businesses. Only ones they belong to; the API checks again. */
export async function switchBusiness(fd: FormData) {
  const id = fd.get("id");
  const me = await requireMe();
  if (typeof id !== "string" || !me.businesses.some((b) => b.id === id)) redirect("/businesses");
  await chooseBusiness(id);
  redirect("/app");
}
