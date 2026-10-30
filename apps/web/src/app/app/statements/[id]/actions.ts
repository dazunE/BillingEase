"use server";

import { agents } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";

export async function retryStatement(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  await call(agents.retryStatement, { params: { id } });
  revalidatePath(`/app/statements/${id}`);
}
