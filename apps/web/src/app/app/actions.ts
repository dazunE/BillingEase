"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { today } from "@/lib/dates";
import { appUrl, redirectWithFlash } from "@/lib/flash";
import { deliverOutbox, withDelivery } from "@/lib/email";
import { LedgerError, type Tx } from "@/lib/ledger";
import { approvePayroll, connectBank, OpError, payBill, sendInvoice, sendReminder } from "@/lib/ops";

/**
 * One-tap actions used by "Needs you" (on Home and elsewhere). Each checks the
 * session, runs in a transaction, then returns to `back` with a confirmation.
 */
type Ctx = { db: Tx; business: Awaited<ReturnType<typeof requireBusiness>>["business"] };

async function run(back: string, done: string, fn: (ctx: Ctx) => Promise<void>): Promise<never> {
  const ctx = await requireBusiness();
  try {
    await ctx.db.transaction(async (tx) => fn({ db: tx, business: ctx.business }));
  } catch (err) {
    if (err instanceof OpError || err instanceof LedgerError) redirectWithFlash(back, err.message);
    throw err;
  }
  // Emails go out only once the books are saved.
  const delivery = await deliverOutbox(ctx.db, ctx.business.id, { appUrl: appUrl() });
  revalidatePath("/app", "layout");
  redirectWithFlash(back, withDelivery(done, delivery));
}

const safeBack = (v: FormDataEntryValue | null) => (typeof v === "string" && v.startsWith("/app") ? v : "/app");

export async function nudgeAction(formData: FormData) {
  const id = String(formData.get("invoiceId"));
  const note = String(formData.get("note") ?? "");
  return run(safeBack(formData.get("back")), "Reminder sent", ({ db, business }) =>
    sendReminder(db, business.id, id, { appUrl: appUrl(), businessName: business.name, personalNote: note }),
  );
}

export async function approvePayrollAction(formData: FormData) {
  const id = String(formData.get("runId"));
  return run(safeBack(formData.get("back")), "Payroll approved", ({ db, business }) => approvePayroll(db, business.id, id));
}

export async function payBillAction(formData: FormData) {
  const id = String(formData.get("billId"));
  return run(safeBack(formData.get("back")), "Bill paid", ({ db, business }) => payBill(db, business.id, id, { paidOn: today() }).then(() => undefined));
}

export async function sendDraftAction(formData: FormData) {
  const id = String(formData.get("invoiceId"));
  return run(safeBack(formData.get("back")), "Invoice sent", ({ db, business }) =>
    sendInvoice(db, business.id, id, { appUrl: appUrl(), businessName: business.name }),
  );
}

export async function connectBankAction(formData: FormData) {
  return run(safeBack(formData.get("back")), "Bank connected", ({ db, business }) => connectBank(db, business.id, today()).then(() => undefined));
}
