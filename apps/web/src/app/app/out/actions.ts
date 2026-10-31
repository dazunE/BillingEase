"use server";

import { goingOut } from "@billingease/contracts";
import { currencyDigits, parseMoney, parseRate, today } from "@billingease/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { call } from "@/lib/api";
import { blankToNull, failed, formValues, type FormState } from "@/lib/form";

/** Reads an amount typed by hand ("1,250.50") into minor units, noting a field error if it isn't one. */
function amount(v: string | undefined, field: string, errors: Record<string, string>, opts: { required?: boolean; label?: string; currency?: string } = {}) {
  const raw = (v ?? "").trim();
  if (!raw) {
    if (opts.required !== false) errors[field] = opts.label ?? "Enter the amount";
    return 0;
  }
  const digits = opts.currency ? currencyDigits(opts.currency) : 2;
  const n = parseMoney(raw, digits);
  if (n == null) {
    errors[field] = digits ? "Enter an amount like 12.50" : "Enter a whole amount like 1200";
    return 0;
  }
  return n;
}

const int = (v: string | undefined, d: number) => (v && /^\d+$/.test(v.trim()) ? Number(v.trim()) : d);

function cheque(v: Record<string, string>) {
  return { chequeNumber: blankToNull(v.chequeNumber), chequeDate: blankToNull(v.chequeDate), chequeBank: blankToNull(v.chequeBank) };
}

function revalidateOut() {
  revalidatePath("/app/out", "layout");
  revalidatePath("/app");
}

/** The currency and rate a bill or expense form sends (`currency`, `fxRate`). */
function fxOf(v: Record<string, string>, errors: Record<string, string>) {
  const fxRate = v.fxRate?.trim() ? parseRate(v.fxRate) : null;
  if (v.fxRate?.trim() && !fxRate) errors.fxRate = "Enter a rate above 0, like 0.7912";
  return { currency: blankToNull(v.currency), fxRate };
}

function invalid(errors: Record<string, string>, values: Record<string, string>): FormState {
  return { message: "Some details need fixing.", errors, values };
}

function expenseBody(v: Record<string, string>, errors: Record<string, string>) {
  const foreign = !!v.currency && v.currency !== v.homeCurrency;
  return {
    ...(foreign ? fxOf(v, errors) : { currency: null, fxRate: null }),
    homeGross: foreign && v.homeGross?.trim() ? amount(v.homeGross, "homeGross", errors, { currency: v.homeCurrency }) : null,
    spentOn: v.spentOn || today(),
    payee: blankToNull(v.payee),
    supplierId: blankToNull(v.supplierId),
    categoryId: v.categoryId && v.categoryId !== "later" ? v.categoryId : null,
    gross: amount(v.gross, "gross", errors, { label: "Enter what you paid", currency: v.currency }),
    vat: amount(v.vat, "vat", errors, { required: false, currency: v.currency }),
    bizPct: int(v.bizPct, 100),
    method: v.method ?? "",
    ...cheque(v),
    note: blankToNull(v.note),
  };
}

// ---------------------------------------------------------------------------
// Expenses

/** Records an expense. Returns its id so the form can then upload a photo or PDF. */
export async function recordExpense(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const errors: Record<string, string> = {};
  const body = expenseBody(v, errors);
  if (Object.keys(errors).length) return invalid(errors, v);
  try {
    const e = await call(goingOut.createExpense, { body });
    revalidateOut();
    return { ok: true, message: "Expense recorded.", values: { id: e.id } };
  } catch (err) {
    return failed(err, v);
  }
}

export async function updateExpense(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const errors: Record<string, string> = {};
  const body = expenseBody(v, errors);
  if (Object.keys(errors).length) return invalid(errors, v);
  try {
    await call(goingOut.updateExpense, { params: { id }, body });
    revalidateOut();
    return { ok: true, message: "Saved. The books now show the new figures.", values: { id } };
  } catch (err) {
    return failed(err, v);
  }
}

export async function categoriseExpense(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  if (!v.categoryId) return { message: "Pick a category.", errors: { categoryId: "Pick a category" }, values: v };
  try {
    await call(goingOut.categoriseExpense, { params: { id: v.id }, body: { categoryId: v.categoryId, bizPct: v.bizPct ? int(v.bizPct, 100) : undefined } });
    revalidateOut();
    return { ok: true, message: "Sorted." };
  } catch (err) {
    return failed(err, v);
  }
}

export async function deleteExpense(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(goingOut.deleteExpense, { params: { id: v.id } });
  } catch (err) {
    return failed(err, v);
  }
  revalidateOut();
  redirect("/app/out");
}

// ---------------------------------------------------------------------------
// Bills

export async function createBill(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const errors: Record<string, string> = {};
  const count = Math.min(int(v.lineCount, 1), 50);
  const lines = [];
  for (let i = 0; i < count; i++) {
    if (!(`lines.${i}.description` in v)) continue;
    lines.push({
      description: v[`lines.${i}.description`] ?? "",
      categoryId: v[`lines.${i}.categoryId`] ?? "",
      net: amount(v[`lines.${i}.net`], `lines.${lines.length}.net`, errors, { currency: v.currency }),
      vat: amount(v[`lines.${i}.vat`], `lines.${lines.length}.vat`, errors, { required: false, currency: v.currency }),
    });
  }
  const fx = fxOf(v, errors);
  if (Object.keys(errors).length) return invalid(errors, v);
  const supplierId = blankToNull(v.supplierId);
  try {
    const bill = await call(goingOut.createBill, {
      body: {
        supplierId: supplierId === "new" ? null : supplierId,
        supplierName: supplierId && supplierId !== "new" ? null : blankToNull(v.supplierName),
        reference: blankToNull(v.reference),
        billDate: v.billDate || today(),
        dueDate: v.dueDate || v.billDate || today(),
        ...fx,
        lines,
      },
    });
    revalidateOut();
    return { ok: true, message: "Bill saved.", values: { id: bill.id } };
  } catch (err) {
    return failed(err, v);
  }
}

export async function payBill(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const errors: Record<string, string> = {};
  const body = {
    amount: amount(v.amount, "amount", errors, { label: "Enter what you paid", currency: v.currency }),
    homeAmount: v.homeAmount?.trim() ? amount(v.homeAmount, "homeAmount", errors, { currency: v.homeCurrency }) : null,
    paidOn: v.paidOn || today(),
    method: v.method ?? "",
    ...cheque(v),
    reference: blankToNull(v.reference),
  };
  if (Object.keys(errors).length) return invalid(errors, v);
  try {
    const bill = await call(goingOut.payBill, { params: { id }, body });
    revalidateOut();
    return { ok: true, message: bill.status === "paid" ? "Paid in full." : "Payment recorded." };
  } catch (err) {
    return failed(err, v);
  }
}

/** "Mark paid" from a list: pays what's left today, by the first way to pay. */
export async function markBillPaid(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(goingOut.payBill, { params: { id: v.id }, body: { amount: Number(v.amount), paidOn: today(), method: v.method, ...cheque(v) } });
    revalidateOut();
    return { ok: true, message: "Marked paid." };
  } catch (err) {
    return failed(err, v);
  }
}

export async function voidBill(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(goingOut.voidBill, { params: { id: v.id } });
    revalidateOut();
    return { ok: true, message: "Bill voided." };
  } catch (err) {
    return failed(err, v);
  }
}

// ---------------------------------------------------------------------------
// Every-month costs

function monthlyBody(v: Record<string, string>, errors: Record<string, string>) {
  return {
    name: v.name ?? "",
    supplierId: blankToNull(v.supplierId),
    categoryId: v.categoryId ?? "",
    amount: amount(v.amount, "amount", errors, { label: "Enter the amount each month" }),
    vat: amount(v.vat, "vat", errors, { required: false }),
    method: v.method ?? "",
    dayOfMonth: int(v.dayOfMonth, 0),
  };
}

export async function saveMonthly(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const errors: Record<string, string> = {};
  const body = monthlyBody(v, errors);
  if (Object.keys(errors).length) return invalid(errors, v);
  try {
    if (v.id) await call(goingOut.updateMonthly, { params: { id: v.id }, body });
    else await call(goingOut.createMonthly, { body });
    revalidateOut();
    return { ok: true, message: v.id ? "Saved." : "Set up. Record it each month when you've paid." };
  } catch (err) {
    return failed(err, v);
  }
}

export async function recordMonthly(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const errors: Record<string, string> = {};
  const gross = v.gross ? amount(v.gross, "gross", errors) : undefined;
  if (Object.keys(errors).length) return invalid(errors, v);
  try {
    await call(goingOut.recordMonthly, { params: { id: v.id }, body: { spentOn: v.spentOn || today(), gross, method: blankToNull(v.method) ?? undefined, ...cheque(v) } });
    revalidateOut();
    return { ok: true, message: "Recorded as paid." };
  } catch (err) {
    return failed(err, v);
  }
}

export async function pauseMonthly(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(goingOut.pauseMonthly, { params: { id: v.id }, body: { active: v.active === "true" } });
    revalidateOut();
    return { ok: true };
  } catch (err) {
    return failed(err, v);
  }
}

export async function deleteMonthly(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(goingOut.deleteMonthly, { params: { id: v.id } });
    revalidateOut();
    return { ok: true, message: "Stopped." };
  } catch (err) {
    return failed(err, v);
  }
}

// ---------------------------------------------------------------------------
// Suppliers

export async function saveSupplier(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const body = {
    name: v.name ?? "", contactName: blankToNull(v.contactName), email: blankToNull(v.email), phone: blankToNull(v.phone),
    address: blankToNull(v.address), vatNumber: blankToNull(v.vatNumber), defaultCategoryId: blankToNull(v.defaultCategoryId), notes: blankToNull(v.notes),
    currency: blankToNull(v.currency),
  };
  let id = v.id;
  try {
    if (id) await call(goingOut.updateSupplier, { params: { id }, body });
    else id = (await call(goingOut.createSupplier, { body })).id;
  } catch (err) {
    return failed(err, v);
  }
  revalidateOut();
  if (!v.id) redirect(`/app/out/suppliers/${id}`);
  return { ok: true, message: "Saved." };
}

export async function archiveSupplier(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(goingOut.archiveSupplier, { params: { id: v.id }, body: { archived: v.archived !== "false" } });
    revalidateOut();
    return { ok: true, message: v.archived !== "false" ? "Archived." : "Brought back." };
  } catch (err) {
    return failed(err, v);
  }
}

// ---------------------------------------------------------------------------
// Attachments

export async function deleteAttachment(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(goingOut.deleteAttachment, { params: { id: v.id } });
    revalidateOut();
    return { ok: true, message: "Removed." };
  } catch (err) {
    return failed(err, v);
  }
}
