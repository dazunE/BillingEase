"use server";

import { agents } from "@billingease/contracts";
import { parseMoney } from "@billingease/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";

/** Approves a proposal; an expense's fields can be corrected first. */
export async function approveProposal(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const payload: Record<string, unknown> = {};
  if (v.kind === "expense.create") {
    const gross = parseMoney(v.gross);
    const vat = parseMoney(v.vat || "0");
    if (gross === null) return { message: "Some details need fixing.", errors: { gross: "Enter an amount like 48 or 48.50" }, values: v };
    if (vat === null) return { message: "Some details need fixing.", errors: { vat: "Enter an amount like 8 or 0" }, values: v };
    Object.assign(payload, { spentOn: v.spentOn, payee: v.payee, categoryId: v.categoryId || null, gross, vat });
  }
  if (v.kind === "invoice.remind") {
    if (!v.message?.trim()) return { message: "Some details need fixing.", errors: { message: "Write the reminder, or turn it down" }, values: v };
    payload.message = v.message.trim();
  }
  try {
    await call(agents.approve, { params: { id: v.id }, body: Object.keys(payload).length ? { payload } : {} });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app", "layout");
  redirect(`/app/check?done=${v.id}`);
}

export async function rejectProposal(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(agents.reject, { params: { id: v.id }, body: { reason: v.reason || null } });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app", "layout");
  redirect(`/app/check?done=${v.id}`);
}

export async function retryCapture(fd: FormData) {
  await call(agents.retryCapture, { params: { id: String(fd.get("id") ?? "") } });
  revalidatePath("/app/check");
}

/** Approves several drafts as they stand: the sure ones from a statement. */
export async function approveMany(fd: FormData) {
  const ids = String(fd.get("ids") ?? "").split(",").filter(Boolean);
  const back = String(fd.get("back") ?? "/app/check");
  if (ids.length) await call(agents.approveMany, { body: { ids } });
  revalidatePath("/app", "layout");
  redirect(back.startsWith("/app/") ? back : "/app/check");
}

/** Drafts reminders for late invoices now. */
export async function runChaser() {
  await call(agents.runChaser, { body: {} });
  revalidatePath("/app/check");
  redirect("/app/check?chasing=1");
}
