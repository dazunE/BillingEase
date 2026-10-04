"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth";
import { today } from "@/lib/dates";
import { emailInvoicePdf, retryEmail } from "@/lib/email";
import { redirectWithFlash } from "@/lib/flash";
import { formatMoney, parseMoney } from "@/lib/money";
import { OpError, recordPayment, sendInvoice, sendReminder } from "@/lib/ops";
import { voidInvoiceAndLog } from "@/lib/ops-in";
import { baseUrl, runAction, safeBack } from "../in/run";

const id = (v: FormDataEntryValue | null) => {
  const parsed = z.uuid().safeParse(v);
  if (!parsed.success) throw new Error("Bad invoice id");
  return parsed.data;
};

export async function sendDraftAction(formData: FormData) {
  const invoiceId = id(formData.get("invoiceId"));
  const url = await baseUrl();
  return runAction(safeBack(formData.get("back")), async ({ db, business }) => {
    await sendInvoice(db, business.id, invoiceId, { appUrl: url, businessName: business.name });
    return "Invoice sent";
  });
}

export async function remindAction(formData: FormData) {
  const invoiceId = id(formData.get("invoiceId"));
  const note = String(formData.get("note") ?? "").slice(0, 2000);
  const url = await baseUrl();
  return runAction(safeBack(formData.get("back")), async ({ db, business }) => {
    await sendReminder(db, business.id, invoiceId, { appUrl: url, businessName: business.name, personalNote: note });
    return note.trim() ? "Nudge sent with your note" : "Friendly nudge sent";
  });
}

const METHODS = ["cash", "check", "bank", "card"] as const;

export async function recordPaymentAction(formData: FormData) {
  const invoiceId = id(formData.get("invoiceId"));
  const back = safeBack(formData.get("back"), `/app/invoices/${invoiceId}`);
  return runAction(back, async ({ db, business }) => {
    const amountCents = parseMoney(String(formData.get("amount") ?? ""));
    if (amountCents == null || amountCents <= 0) throw new OpError("Enter the amount you received, like 250 or 250.00.");
    const method = z.enum(METHODS).safeParse(formData.get("method"));
    if (!method.success) throw new OpError("Choose how they paid.");
    const date = String(formData.get("receivedOn") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new OpError("Enter the date you received it.");
    if (date > today()) throw new OpError("The date can't be in the future.");
    const { payment } = await recordPayment(db, business.id, invoiceId, { amountCents, method: method.data, receivedOn: date });
    return `Payment of ${formatMoney(payment.amountCents)} recorded`;
  });
}

export async function voidAction(formData: FormData) {
  const invoiceId = id(formData.get("invoiceId"));
  return runAction(`/app/invoices/${invoiceId}`, async ({ db, business }) => {
    const wasDraft = await voidInvoiceAndLog(db, business.id, invoiceId);
    return wasDraft ? "Draft discarded" : "Invoice voided";
  });
}

export async function emailPdfAction(formData: FormData) {
  const invoiceId = id(formData.get("invoiceId"));
  const to = String(formData.get("to") ?? "").slice(0, 300);
  const note = String(formData.get("note") ?? "").slice(0, 2000);
  const url = await baseUrl();
  return runAction(`/app/invoices/${invoiceId}`, async ({ db, business }) => {
    await emailInvoicePdf(db, business.id, invoiceId, { to, note }, { appUrl: url, businessName: business.name });
    return `PDF emailed to ${to.trim()}`;
  });
}

export async function retryEmailAction(formData: FormData) {
  const emailId = id(formData.get("emailId"));
  const { db, business } = await requireBusiness();
  let flash: string;
  try {
    const r = await retryEmail(db, business.id, emailId, { appUrl: await baseUrl() });
    flash = r.failed.length ? `Still couldn't send it: ${r.failed[0].error}` : "Email sent";
  } catch (err) {
    if (!(err instanceof OpError)) throw err;
    flash = err.message;
  }
  revalidatePath("/app/outbox");
  redirectWithFlash("/app/outbox", flash);
}
