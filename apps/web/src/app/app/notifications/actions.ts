"use server";

import { home } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";

export async function toggleRead(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  await call(home.markRead, { params: { id }, body: { read: fd.get("read") === "true" } });
  revalidatePath("/app", "layout");
}

export async function markAllRead() {
  await call(home.markAllRead);
  revalidatePath("/app", "layout");
}
