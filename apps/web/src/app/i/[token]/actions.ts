"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { today } from "@/lib/dates";
import { LedgerError } from "@/lib/ledger";
import { OpError } from "@/lib/ops";
import { payInvoiceOnline } from "@/lib/ops-in";

export type PayState = { errors?: Record<string, string>; method?: "card" | "bank"; values?: Record<string, string> } | undefined;

/** Luhn check, so typos are caught before we try the card. */
function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** Public: the customer pays their invoice. No login; the token is the key. */
export async function payOnlineAction(token: string, _prev: PayState, formData: FormData): Promise<PayState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const method = get("method") === "bank" ? "bank" : "card";
  const errors: Record<string, string> = {};
  const name = get("name");
  if (!name) errors.name = method === "card" ? "Enter the name on the card." : "Enter the account holder's name.";
  let cardNumber: string | undefined;

  if (method === "card") {
    cardNumber = get("cardNumber").replace(/[\s-]/g, "");
    if (!/^\d{12,19}$/.test(cardNumber) || !luhn(cardNumber)) errors.cardNumber = "Check the card number.";
    const exp = get("expiry").match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/);
    if (!exp) errors.expiry = "Use MM/YY, like 08/29.";
    else {
      const month = Number(exp[1]);
      const year = Number(exp[2].length === 2 ? "20" + exp[2] : exp[2]);
      const now = today();
      const current = Number(now.slice(0, 4)) * 12 + Number(now.slice(5, 7));
      if (month < 1 || month > 12) errors.expiry = "Use MM/YY, like 08/29.";
      else if (year * 12 + month < current) errors.expiry = "This card has expired.";
    }
    if (!/^\d{3,4}$/.test(get("cvc"))) errors.cvc = "3 or 4 digits on the back.";
  } else {
    if (!/^\d{9}$/.test(get("routing"))) errors.routing = "Routing numbers are 9 digits.";
    if (!/^\d{4,17}$/.test(get("account"))) errors.account = "Enter the account number (digits only).";
  }
  // Card number, CVC and account number are never sent back to the page.
  const values = { name, expiry: get("expiry"), routing: get("routing") };
  if (Object.keys(errors).length) return { errors, method, values };

  const db = await getDb();
  let paymentId: string;
  try {
    const { payment } = await db.transaction((tx) => payInvoiceOnline(tx, token, { method, cardNumber, receivedOn: today() }));
    paymentId = payment.id;
  } catch (err) {
    if (err instanceof OpError || err instanceof LedgerError) return { errors: { form: err.message }, method, values };
    throw err;
  }
  revalidatePath("/app", "layout");
  redirect(`/i/${encodeURIComponent(token)}?receipt=${paymentId}`);
}
