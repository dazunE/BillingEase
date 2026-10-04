"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth";
import { today } from "@/lib/dates";
import { redirectWithFlash } from "@/lib/flash";
import { LedgerError } from "@/lib/ledger";
import { formatMoney, parseMoney } from "@/lib/money";
import { OpError, type InvoiceLineInput } from "@/lib/ops";
import { createAndSendInvoice } from "@/lib/ops-in";
import { DUE_DAYS, NEW_CUSTOMER } from "@/components/in/shared";
import { baseUrl } from "./run";

export type BillState = { errors?: Record<string, string> } | undefined;

/** "Bill [customer] [$ amount] for [what], due in [N days]." → a sent invoice. */
export async function billSomeoneAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const { business, db } = await requireBusiness();
  const errors: Record<string, string> = {};
  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const customerChoice = get("customer");
  const isNew = customerChoice === NEW_CUSTOMER;
  const newName = get("newName").slice(0, 200);
  const newEmail = get("newEmail").toLowerCase();
  if (!customerChoice) errors.customer = "Choose who you're billing.";
  else if (isNew && !newName) errors.newName = "Type the new customer's name.";
  else if (!isNew && !z.uuid().safeParse(customerChoice).success) errors.customer = "Choose who you're billing.";
  if (isNew && newEmail && !z.email().safeParse(newEmail).success) errors.newEmail = "That email doesn't look right. Leave it empty if you don't have one.";

  const amount = parseMoney(get("amount"));
  if (amount == null || amount <= 0) errors.amount = "Enter an amount, like 1,250 or 99.50.";
  const what = get("what").slice(0, 300);
  if (!what) errors.what = "Say what it's for.";
  const due = Number(get("due"));
  if (!(DUE_DAYS as readonly number[]).includes(due)) errors.due = "Choose when it's due.";

  const lines: InvoiceLineInput[] = [];
  if (amount && what) lines.push({ description: what, quantity: 1, unitCents: amount });
  const descs = formData.getAll("lineDesc").map((v) => String(v).trim());
  const amts = formData.getAll("lineAmount").map((v) => String(v).trim());
  descs.forEach((d, i) => {
    const a = amts[i] ?? "";
    if (!d && !a) return; // an empty row is just ignored
    const cents = parseMoney(a);
    if (!d) errors[`line${i}`] = "Add a description for this line, or remove it.";
    else if (cents == null || cents <= 0) errors[`line${i}`] = "Enter an amount for this line.";
    else lines.push({ description: d.slice(0, 300), quantity: 1, unitCents: cents });
  });

  const allowCard = formData.get("allowCard") === "on";
  const allowBank = formData.get("allowBank") === "on";
  if (!allowCard && !allowBank) errors.pay = "Let them pay at least one way, or they'll have to pay you outside BillingEase.";

  if (Object.keys(errors).length) return { errors };

  const url = await baseUrl();
  let result: Awaited<ReturnType<typeof createAndSendInvoice>>;
  try {
    result = await db.transaction((tx) =>
      createAndSendInvoice(
        tx,
        business.id,
        {
          customerId: isNew ? null : customerChoice,
          newCustomer: isNew ? { name: newName, email: newEmail || null } : null,
          lines,
          issueDate: today(),
          dueInDays: due,
          allowCard,
          allowBank,
          repeatMonthly: formData.get("repeat") === "on",
        },
        { appUrl: url, businessName: business.name },
      ),
    );
  } catch (err) {
    if (err instanceof OpError || err instanceof LedgerError) return { errors: { form: err.message } };
    throw err;
  }
  revalidatePath("/app", "layout");
  const { invoice, customer, emailed } = result;
  if (emailed) redirectWithFlash("/app/in", `Sent ${invoice.number} to ${customer.name} for ${formatMoney(invoice.totalCents)}`);
  // Nobody was emailed: go to the invoice, where the pay link is ready to copy.
  redirectWithFlash(`/app/invoices/${invoice.id}`, `${invoice.number} is ready, but ${customer.name} has no email address, so nothing was emailed. Copy the pay link below.`);
}
