"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth";
import { today } from "@/lib/dates";
import { redirectWithFlash } from "@/lib/flash";
import { LedgerError, type Tx } from "@/lib/ledger";
import { formatMoney, parseMoney } from "@/lib/money";
import { approvePayroll, categorizeTransaction, connectBank, OpError, payBill } from "@/lib/ops";
import { addBill, addExpense, addVendor, assertCategoryFits, syncFeeds } from "@/lib/ops-out";

/**
 * Server actions for Going out, Transactions, Bills and Vendors. Every action
 * checks the session, validates its input, runs in a transaction and
 * refreshes the whole app so the three numbers update.
 */

type Ctx = { db: Tx; businessId: string };
type Business = Awaited<ReturnType<typeof requireBusiness>>["business"];

const uuid = z.uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const safeBack = (v: FormDataEntryValue | null, fallback = "/app/out") =>
  typeof v === "string" && /^\/app(\/|$|\?|#)/.test(v) && !v.startsWith("//") ? v : fallback;

function friendly(err: unknown): string | null {
  if (err instanceof OpError || err instanceof LedgerError) return err.message;
  return null;
}

async function inTx<T>(fn: (ctx: Ctx, business: Business) => Promise<T>): Promise<T> {
  const { db, business } = await requireBusiness();
  return db.transaction((tx) => fn({ db: tx, businessId: business.id }, business));
}

/** Form-post actions: run, refresh, and go back with a toast. */
async function runAndReturn(back: string, done: string | ((r: unknown) => string), fn: (ctx: Ctx) => Promise<unknown>): Promise<never> {
  let result: unknown;
  try {
    result = await inTx(fn);
  } catch (err) {
    const msg = friendly(err);
    if (msg) redirectWithFlash(back, msg);
    throw err;
  }
  revalidatePath("/app", "layout");
  redirectWithFlash(back, typeof done === "string" ? done : done(result));
}

// ---------------------------------------------------------------------------
// Sorting

export type SortResult = { ok: true } | { ok: false; error: string };

/** Files one bank/card transaction. Called directly from the one-at-a-time sorter. */
export async function sortTransactionAction(txId: string, categoryAccountId: string, remember: boolean): Promise<SortResult> {
  if (!uuid.safeParse(txId).success || !uuid.safeParse(categoryAccountId).success) return { ok: false, error: "Choose a category." };
  try {
    await inTx(async ({ db, businessId }) => {
      await assertCategoryFits(db, businessId, txId, categoryAccountId);
      await categorizeTransaction(db, businessId, txId, categoryAccountId, { remember: remember === true });
    });
  } catch (err) {
    const msg = friendly(err);
    if (msg) return { ok: false, error: msg };
    throw err;
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}

/** "Change category" on the transactions list. */
export async function changeCategoryAction(formData: FormData) {
  const back = safeBack(formData.get("back"), "/app/transactions");
  const txId = uuid.safeParse(formData.get("txId"));
  const categoryId = uuid.safeParse(formData.get("categoryAccountId"));
  if (!txId.success || !categoryId.success) redirectWithFlash(back, "Choose a category.");
  const remember = formData.get("remember") === "on";
  return runAndReturn(back, "Category saved", async ({ db, businessId }) => {
    await assertCategoryFits(db, businessId, txId.data!, categoryId.data!);
    await categorizeTransaction(db, businessId, txId.data!, categoryId.data!, { remember });
  });
}

// ---------------------------------------------------------------------------
// Payroll and bills

export async function approvePayrollOutAction(formData: FormData) {
  const back = safeBack(formData.get("back"));
  const runId = uuid.safeParse(formData.get("runId"));
  if (!runId.success) redirectWithFlash(back, "Payroll run not found.");
  return runAndReturn(back, "Payroll approved", ({ db, businessId }) => approvePayroll(db, businessId, runId.data!));
}

export async function payBillOutAction(formData: FormData) {
  const back = safeBack(formData.get("back"));
  const billId = uuid.safeParse(formData.get("billId"));
  if (!billId.success) redirectWithFlash(back, "Bill not found.");
  return runAndReturn(back, "Bill paid", ({ db, businessId }) => payBill(db, businessId, billId.data!, { paidOn: today() }));
}

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string>; nonce?: number };

const billSchema = z.object({
  vendorName: z.string().trim().min(1, "Who is the bill from?").max(120),
  description: z.string().trim().max(200),
  categoryAccountId: z.uuid("Choose a category."),
  amount: z.string(),
  billDate: isoDate,
  dueDate: isoDate,
});

export async function addBillAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = billSchema.safeParse({
    vendorName: formData.get("vendorName") ?? "",
    description: formData.get("description") ?? "",
    categoryAccountId: formData.get("categoryAccountId") ?? "",
    amount: formData.get("amount") ?? "",
    billDate: formData.get("billDate") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });
  const errors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = key === "billDate" || key === "dueDate" ? "Pick a date." : issue.message;
    }
  }
  const cents = parseMoney(String(formData.get("amount") ?? ""));
  if (!cents || cents <= 0) errors.amount = "Add an amount above $0.";
  if (parsed.success && parsed.data.dueDate < parsed.data.billDate) errors.dueDate = "The due date can't be before the bill date.";
  if (Object.keys(errors).length || !parsed.success || !cents) return { ok: false, errors };

  const d = parsed.data;
  try {
    await inTx(({ db, businessId }) =>
      addBill(db, businessId, { vendorName: d.vendorName, description: d.description, categoryAccountId: d.categoryAccountId, amountCents: cents, billDate: d.billDate, dueDate: d.dueDate }),
    );
  } catch (err) {
    const msg = friendly(err);
    if (msg) return { ok: false, message: msg };
    throw err;
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: `Added ${formatMoney(cents)} from ${d.vendorName}`, nonce: Date.now() };
}

// ---------------------------------------------------------------------------
// Expenses

const expenseSchema = z.object({
  description: z.string().trim().min(1, "Say what it was for.").max(200),
  paidFromAccountId: z.uuid("Choose what you paid with."),
  categoryAccountId: z.uuid("Choose a category."),
  spentOn: isoDate,
});

export async function recordExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = expenseSchema.safeParse({
    description: formData.get("description") ?? "",
    paidFromAccountId: formData.get("paidFromAccountId") ?? "",
    categoryAccountId: formData.get("categoryAccountId") ?? "",
    spentOn: formData.get("spentOn") ?? "",
  });
  const errors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = key === "spentOn" ? "Pick the date you paid." : issue.message;
    }
  }
  const cents = parseMoney(String(formData.get("amount") ?? ""));
  if (!cents || cents <= 0) errors.amount = "Add an amount above $0.";
  if (parsed.success && parsed.data.spentOn > today()) errors.spentOn = "That date is in the future. Add it as a bill instead.";
  if (Object.keys(errors).length || !parsed.success || !cents) return { ok: false, errors };

  const d = parsed.data;
  let category = "";
  try {
    const r = await inTx(({ db, businessId }) => addExpense(db, businessId, { ...d, amountCents: cents }));
    category = r.category.name;
  } catch (err) {
    const msg = friendly(err);
    if (msg) return { ok: false, message: msg };
    throw err;
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: `${formatMoney(cents)} for ${d.description} filed under ${category}`, nonce: Date.now() };
}

// ---------------------------------------------------------------------------
// Bank feeds

export async function connectBankOutAction(formData: FormData) {
  const back = safeBack(formData.get("back"), "/app/transactions");
  return runAndReturn(
    back,
    (r) => {
      const n = (r as { imported: number }).imported;
      return `Bank connected · ${n} transaction${n === 1 ? "" : "s"} imported`;
    },
    ({ db, businessId }) => connectBank(db, businessId, today()),
  );
}

export async function syncNowAction(formData: FormData) {
  const back = safeBack(formData.get("back"), "/app/transactions");
  return runAndReturn(
    back,
    (r) => {
      const n = (r as { imported: number }).imported;
      return n ? `Imported ${n} new transaction${n === 1 ? "" : "s"}` : "You're up to date";
    },
    ({ db, businessId }) => syncFeeds(db, businessId, today()),
  );
}

// ---------------------------------------------------------------------------
// Vendors

const vendorSchema = z.object({
  name: z.string().trim().min(1, "Add the vendor's name.").max(120),
  email: z.union([z.literal(""), z.email("That email address doesn't look right.")]),
});

export async function addVendorAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = vendorSchema.safeParse({ name: formData.get("name") ?? "", email: String(formData.get("email") ?? "").trim() });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  try {
    await inTx(({ db, businessId }) => addVendor(db, businessId, parsed.data));
  } catch (err) {
    const msg = friendly(err);
    if (msg) return { ok: false, errors: { name: msg } };
    throw err;
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: `Added ${parsed.data.name}`, nonce: Date.now() };
}
