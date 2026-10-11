"use server";

import { comingIn, type LineInput } from "@billingease/contracts";
import { parseMoney } from "@billingease/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EditorPayload } from "@/components/in/DocEditor";
import { ApiFailure, call } from "@/lib/api";
import { blankToNull, checked, failed, formValues, type FormState } from "@/lib/form";

function qtyMilli(s: string) {
  const n = Number(String(s).replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : 0;
}

function refresh() {
  revalidatePath("/app/in", "layout");
  revalidatePath("/app");
}

/** Sends the person back to a page with the API's reason in plain words. */
function back(path: string, err: unknown): never {
  if (err instanceof ApiFailure) redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(err.message)}`);
  throw err;
}

function readPayload(fd: FormData): EditorPayload {
  return JSON.parse(String(fd.get("payload") ?? "{}")) as EditorPayload;
}

/** The editor's lines as the API wants them, noting field errors for what can't be read. */
function linesOf(p: EditorPayload, errors: Record<string, string>): LineInput[] {
  const kept = p.lines.filter((l) => l.description.trim() || l.price.trim());
  return kept.map((l, i) => {
    const unitPrice = parseMoney(l.price);
    if (!l.price.trim()) errors[`lines.${i}.unitPrice`] = "Enter a price";
    else if (unitPrice == null) errors[`lines.${i}.unitPrice`] = "Enter a price like 12.50";
    const discount = l.discount.trim() ? parseMoney(l.discount) : 0;
    if (discount == null) errors[`lines.${i}.discount`] = "Enter an amount like 5.00";
    const q = qtyMilli(l.qty);
    if (!q) errors[`lines.${i}.quantityMilli`] = "Enter a quantity more than 0";
    if (!l.description.trim()) errors[`lines.${i}.description`] = "Say what this line is for";
    return { itemId: l.itemId, description: l.description.trim(), quantityMilli: q || 1000, unitPrice: unitPrice ?? 0, discount: discount ?? 0, vatRateId: l.vatRateId, sscl: l.sscl };
  });
}

/** The chosen customer, or a new one added inline. */
async function customerIdOf(p: EditorPayload, errors: Record<string, string>): Promise<string | null> {
  if (p.customerId === "__new") {
    const nc = p.newCustomer ?? { name: "", email: "", taxId: "", vatNumber: "" };
    if (!nc.name.trim()) {
      errors["newCustomer.name"] = "Enter the customer's name";
      return null;
    }
    if (Object.keys(errors).length) return null;
    try {
      const c = await call(comingIn.createCustomer, { body: { name: nc.name, email: blankToNull(nc.email), taxId: blankToNull(nc.taxId), vatNumber: blankToNull(nc.vatNumber) } });
      return c.id;
    } catch (err) {
      if (err instanceof ApiFailure && err.fields) for (const [k, v] of Object.entries(err.fields)) errors[`newCustomer.${k}`] = v;
      else throw err;
      return null;
    }
  }
  if (!p.customerId) errors.customerId = "Choose a customer";
  return p.customerId || null;
}

const invalid = (errors: Record<string, string>, id?: string): FormState => ({ message: "Some details need fixing.", errors, values: id ? { id } : undefined });

// ---------------------------------------------------------------------------
// Invoices

export async function saveInvoice(_: FormState, fd: FormData): Promise<FormState> {
  const p = readPayload(fd);
  const intent = String(fd.get("intent") ?? "draft");
  const errors: Record<string, string> = {};
  const lines = linesOf(p, errors);
  if (intent !== "draft" && !lines.length) errors.lines = "Add at least one line";
  if (Object.keys(errors).length) return invalid(errors, p.id);
  const customerId = await customerIdOf(p, errors);
  if (!customerId || Object.keys(errors).length) return invalid(errors, p.id);
  const body = { customerId, issueDate: p.issueDate, supplyDate: blankToNull(p.supplyDate), dueDate: blankToNull(p.dueDate), notes: blankToNull(p.notes), reference: blankToNull(p.reference), lines };
  let id = p.id;
  try {
    const saved = id ? await call(comingIn.updateInvoice, { params: { id }, body }) : await call(comingIn.createInvoice, { body });
    id = saved.id;
    if (intent === "send" || intent === "mark") await call(comingIn.issueInvoice, { params: { id }, body: { email: intent === "send" } });
  } catch (err) {
    refresh();
    const s = failed(err);
    return { ...s, values: id ? { id } : undefined, message: id && !p.id ? `Saved as a draft. ${s?.message ?? ""}` : s?.message };
  }
  refresh();
  redirect(`/app/in/invoices/${id}${intent === "send" ? "?done=sent" : intent === "mark" ? "?done=issued" : "?done=saved"}`);
}

export async function issueInvoice(id: string, email: boolean) {
  try {
    await call(comingIn.issueInvoice, { params: { id }, body: { email } });
  } catch (err) {
    back(`/app/in/invoices/${id}`, err);
  }
  refresh();
  redirect(`/app/in/invoices/${id}?done=${email ? "sent" : "issued"}`);
}

export async function emailInvoice(id: string) {
  try {
    await call(comingIn.emailInvoice, { params: { id }, body: {} });
  } catch (err) {
    back(`/app/in/invoices/${id}`, err);
  }
  refresh();
  redirect(`/app/in/invoices/${id}?done=emailed`);
}

export async function deleteInvoice(id: string) {
  try {
    await call(comingIn.deleteInvoice, { params: { id } });
  } catch (err) {
    back(`/app/in/invoices/${id}`, err);
  }
  refresh();
  redirect("/app/in/invoices?status=draft");
}

export async function voidInvoice(id: string, fd: FormData) {
  try {
    await call(comingIn.voidInvoice, { params: { id }, body: { reason: blankToNull(String(fd.get("reason") ?? "")) } });
  } catch (err) {
    back(`/app/in/invoices/${id}`, err);
  }
  refresh();
  redirect(`/app/in/invoices/${id}?done=voided`);
}

export async function recordPayment(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const amount = parseMoney(v.amount ?? "");
  if (amount == null || amount <= 0) return { message: "Some details need fixing.", errors: { amount: "Enter an amount like 250.00" }, values: v };
  const cheque = v.method === "Cheque";
  try {
    await call(comingIn.recordPayment, {
      params: { id },
      body: {
        amount, receivedOn: v.receivedOn ?? "", method: v.method ?? "", reference: blankToNull(v.reference),
        chequeNumber: cheque ? blankToNull(v.chequeNumber) : null, chequeDate: cheque ? blankToNull(v.chequeDate) : null, chequeBank: cheque ? blankToNull(v.chequeBank) : null,
      },
    });
  } catch (err) {
    return failed(err, v);
  }
  refresh();
  redirect(`/app/in/invoices/${id}?done=paid`);
}

export async function voidPayment(id: string, paymentId: string) {
  try {
    await call(comingIn.voidPayment, { params: { id, paymentId }, body: {} });
  } catch (err) {
    back(`/app/in/invoices/${id}`, err);
  }
  refresh();
  redirect(`/app/in/invoices/${id}?done=unpaid`);
}

export async function creditNote(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const full = v.scope !== "part";
  const lines: { lineId: string; quantityMilli: number; unitPrice?: number }[] = [];
  const errors: Record<string, string> = {};
  if (!full) {
    for (const [k, val] of Object.entries(v)) {
      const m = /^pick_(.+)$/.exec(k);
      if (!m || !checked(val)) continue;
      const lineId = m[1];
      const q = qtyMilli(v[`qty_${lineId}`] ?? "");
      const price = v[`price_${lineId}`]?.trim() ? parseMoney(v[`price_${lineId}`]) : undefined;
      if (!q) errors[`qty_${lineId}`] = "Enter a quantity";
      if (price === null) errors[`price_${lineId}`] = "Enter a price like 12.50";
      lines.push({ lineId, quantityMilli: q || 1000, ...(price != null ? { unitPrice: price } : {}) });
    }
    if (!lines.length) errors.scope = "Tick the lines to credit";
  }
  if (Object.keys(errors).length) return { message: "Some details need fixing.", errors, values: v };
  let cnId: string;
  try {
    const cn = await call(comingIn.creditNote, { params: { id }, body: { full, lines, reason: blankToNull(v.reason), issueDate: v.issueDate || undefined, email: checked(v.email) } });
    cnId = cn.id;
  } catch (err) {
    return failed(err, v);
  }
  refresh();
  redirect(`/app/in/invoices/${cnId}?done=credited`);
}

export async function remind(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    const r = await call(comingIn.remind, { params: { id }, body: { message: blankToNull(v.message), email: v.channel !== "whatsapp" } });
    refresh();
    return { ok: true, message: r.emailed ? "Reminder emailed with the PDF." : "Reminder ready to send on WhatsApp.", values: { whatsappUrl: r.whatsappUrl ?? "" } };
  } catch (err) {
    return failed(err, v);
  }
}

// ---------------------------------------------------------------------------
// Customers and prices

function customerBody(v: Record<string, string>) {
  return {
    name: v.name ?? "", contactName: blankToNull(v.contactName), email: blankToNull(v.email), phone: blankToNull(v.phone), address: blankToNull(v.address),
    taxId: blankToNull(v.taxId), vatNumber: blankToNull(v.vatNumber), notes: blankToNull(v.notes),
  };
}

export async function saveCustomer(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  let cid = id;
  try {
    const c = id ? await call(comingIn.updateCustomer, { params: { id }, body: customerBody(v) }) : await call(comingIn.createCustomer, { body: customerBody(v) });
    cid = c.id;
  } catch (err) {
    return failed(err, v);
  }
  refresh();
  if (!id) redirect(v.then === "invoice" ? `/app/in/invoices/new?customer=${cid}` : `/app/in/customers/${cid}?done=added`);
  return { ok: true, message: "Saved.", values: v };
}

export async function archiveCustomer(id: string, archived: boolean) {
  try {
    await call(comingIn.archiveCustomer, { params: { id }, body: { archived } });
  } catch (err) {
    back(`/app/in/customers/${id}`, err);
  }
  refresh();
  redirect(archived ? "/app/in/customers?done=archived" : `/app/in/customers/${id}`);
}

export async function saveItem(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const unitPrice = parseMoney(v.unitPrice ?? "");
  if (unitPrice == null) return { message: "Some details need fixing.", errors: { unitPrice: "Enter a price like 45.00" }, values: v };
  const body = { name: v.name ?? "", description: blankToNull(v.description), unit: blankToNull(v.unit), unitPrice, vatRateId: blankToNull(v.vatRateId), sscl: checked(v.sscl) };
  try {
    if (id) await call(comingIn.updateItem, { params: { id }, body });
    else await call(comingIn.createItem, { body });
  } catch (err) {
    return failed(err, v);
  }
  refresh();
  return { ok: true, message: id ? "Saved." : `${body.name} added.`, values: id ? v : {} };
}

export async function archiveItem(id: string, archived: boolean) {
  try {
    await call(comingIn.archiveItem, { params: { id }, body: { archived } });
  } catch (err) {
    back("/app/in/prices", err);
  }
  refresh();
  redirect("/app/in/prices");
}

// ---------------------------------------------------------------------------
// Quotes

export async function saveQuote(_: FormState, fd: FormData): Promise<FormState> {
  const p = readPayload(fd);
  const intent = String(fd.get("intent") ?? "draft");
  const errors: Record<string, string> = {};
  const lines = linesOf(p, errors);
  if (intent !== "draft" && !lines.length) errors.lines = "Add at least one line";
  if (Object.keys(errors).length) return invalid(errors, p.id);
  const customerId = await customerIdOf(p, errors);
  if (!customerId || Object.keys(errors).length) return invalid(errors, p.id);
  const body = { customerId, issueDate: p.issueDate, expiryDate: blankToNull(p.expiryDate), notes: blankToNull(p.notes), lines };
  let id = p.id;
  try {
    const saved = id ? await call(comingIn.updateQuote, { params: { id }, body }) : await call(comingIn.createQuote, { body });
    id = saved.id;
    if (intent === "send" || intent === "mark") await call(comingIn.sendQuote, { params: { id }, body: { email: intent === "send" } });
  } catch (err) {
    refresh();
    const s = failed(err);
    return { ...s, values: id ? { id } : undefined };
  }
  refresh();
  redirect(`/app/in/quotes/${id}?done=${intent === "send" ? "sent" : intent === "mark" ? "marked" : "saved"}`);
}

export async function sendQuote(id: string, email: boolean) {
  try {
    await call(comingIn.sendQuote, { params: { id }, body: { email } });
  } catch (err) {
    back(`/app/in/quotes/${id}`, err);
  }
  refresh();
  redirect(`/app/in/quotes/${id}?done=${email ? "sent" : "marked"}`);
}

export async function decideQuote(id: string, decision: "accepted" | "declined", fd: FormData) {
  try {
    await call(comingIn.decideQuote, { params: { id }, body: { decision, note: blankToNull(String(fd.get("note") ?? "")) } });
  } catch (err) {
    back(`/app/in/quotes/${id}`, err);
  }
  refresh();
  redirect(`/app/in/quotes/${id}?done=${decision}`);
}

export async function convertQuote(id: string) {
  let invoiceId: string;
  try {
    invoiceId = (await call(comingIn.convertQuote, { params: { id }, body: {} })).invoiceId;
  } catch (err) {
    back(`/app/in/quotes/${id}`, err);
  }
  refresh();
  redirect(`/app/in/invoices/${invoiceId}/edit?from=quote`);
}

export async function deleteQuote(id: string) {
  try {
    await call(comingIn.deleteQuote, { params: { id } });
  } catch (err) {
    back(`/app/in/quotes/${id}`, err);
  }
  refresh();
  redirect("/app/in/quotes");
}

// ---------------------------------------------------------------------------
// Repeating invoices

export async function saveRecurring(_: FormState, fd: FormData): Promise<FormState> {
  const p = readPayload(fd);
  const errors: Record<string, string> = {};
  const lines = linesOf(p, errors);
  if (!lines.length) errors.lines = "Add at least one line";
  if (!p.name.trim()) errors.name = "Give it a name";
  if (Object.keys(errors).length) return invalid(errors, p.id);
  const customerId = await customerIdOf(p, errors);
  if (!customerId || Object.keys(errors).length) return invalid(errors, p.id);
  const body = {
    customerId, name: p.name, frequency: p.frequency as "monthly", nextRun: p.nextRun, endDate: blankToNull(p.endDate), mode: (p.recurMode === "send" ? "send" : "draft") as "draft" | "send",
    termsDays: p.termsDays, notes: blankToNull(p.notes), reference: blankToNull(p.reference), lines,
  };
  let id = p.id;
  try {
    id = (id ? await call(comingIn.updateRecurring, { params: { id }, body }) : await call(comingIn.createRecurring, { body })).id;
  } catch (err) {
    const s = failed(err);
    return { ...s, values: id ? { id } : undefined };
  }
  refresh();
  redirect(`/app/in/repeating/${id}?done=saved`);
}

export async function pauseRecurring(id: string, active: boolean) {
  try {
    await call(comingIn.pauseRecurring, { params: { id }, body: { active } });
  } catch (err) {
    back(`/app/in/repeating/${id}`, err);
  }
  refresh();
  redirect(`/app/in/repeating/${id}?done=${active ? "resumed" : "paused"}`);
}

export async function runRecurring(id: string) {
  let invoiceId: string;
  try {
    invoiceId = (await call(comingIn.runRecurring, { params: { id }, body: {} })).invoiceId;
  } catch (err) {
    back(`/app/in/repeating/${id}`, err);
  }
  refresh();
  redirect(`/app/in/invoices/${invoiceId}?done=made`);
}

export async function deleteRecurring(id: string) {
  try {
    await call(comingIn.deleteRecurring, { params: { id } });
  } catch (err) {
    back(`/app/in/repeating/${id}`, err);
  }
  refresh();
  redirect("/app/in/repeating");
}
