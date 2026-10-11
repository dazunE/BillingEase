"use server";

import { ask } from "@billingease/contracts";
import { redirect } from "next/navigation";
import { call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";

export async function askQuestion(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  let threadId: string;
  try {
    const r = await call(ask.ask, { body: { question: v.question ?? "", threadId: v.threadId || null } });
    threadId = r.threadId;
  } catch (err) {
    return failed(err, v);
  }
  redirect(`/app/ask?thread=${threadId}#latest`);
}
