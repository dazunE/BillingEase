"use server";

import { comingIn, people } from "@billingease/contracts";
import { parseCsv } from "@billingease/core";
import { revalidatePath } from "next/cache";
import { ApiFailure, call } from "@/lib/api";

export async function endSession(fd: FormData) {
  await call(people.endSession, { params: { id: String(fd.get("id")) } });
  revalidatePath("/app/settings/security");
}

export async function endOtherSessions() {
  await call(people.endOtherSessions);
  revalidatePath("/app/settings/security");
}

export type ImportState = { ok?: boolean; message?: string; added?: number; skipped?: { line: number; why: string }[] } | undefined;

const MAX_ROWS = 500;
const COLUMNS: Record<string, "name" | "email" | "contactName" | "phone" | "address" | "taxId" | "vatNumber"> = {
  name: "name", customer: "name", company: "name", business: "name", "customer name": "name",
  email: "email", "e-mail": "email", "email address": "email",
  contact: "contactName", "contact name": "contactName",
  phone: "phone", telephone: "phone", mobile: "phone",
  address: "address",
  tin: "taxId", "tax id": "taxId", "tax number": "taxId",
  vat: "vatNumber", "vat number": "vatNumber", "vat registration number": "vatNumber",
};

/**
 * Bring your customers in: a CSV with a header row naming its columns (name and email at
 * least). Each row is added like a customer typed in by hand; ones already there are skipped.
 */
export async function importCustomers(_: ImportState, fd: FormData): Promise<ImportState> {
  const file = fd.get("file");
  const pasted = String(fd.get("rows") ?? "");
  const text = file instanceof File && file.size > 0 ? await file.text() : pasted;
  if (!text.trim()) return { message: "Choose a CSV file, or paste the rows." };
  if (text.length > 2_000_000) return { message: "That file is over 2 MB. Split it into smaller files." };
  const rows = parseCsv(text);
  const head = (rows[0] ?? []).map((h) => COLUMNS[h.toLowerCase().replace(/\s+/g, " ").trim()]);
  if (!head.includes("name")) return { message: "The first row should name the columns, like name,email. We couldn't find a name column." };
  const body = rows.slice(1);
  if (!body.length) return { message: "There are no customers under the first row." };
  if (body.length > MAX_ROWS) return { message: `That's ${body.length} customers. Import up to ${MAX_ROWS} at a time.` };

  const existing = new Set((await call(comingIn.listCustomers, { query: { archived: "all" } })).customers.map((c) => c.name.trim().toLowerCase()));
  let added = 0;
  const skipped: { line: number; why: string }[] = [];
  for (const [i, r] of body.entries()) {
    const c: Record<string, string> = {};
    head.forEach((k, j) => { if (k && r[j]) c[k] = r[j]; });
    const line = i + 2;
    if (!c.name) { skipped.push({ line, why: "No name" }); continue; }
    if (existing.has(c.name.toLowerCase())) { skipped.push({ line, why: `${c.name} is already a customer` }); continue; }
    try {
      await call(comingIn.createCustomer, { body: c as { name: string } });
      existing.add(c.name.toLowerCase());
      added++;
    } catch (err) {
      if (!(err instanceof ApiFailure)) throw err;
      skipped.push({ line, why: Object.values(err.fields ?? {})[0] ?? err.message });
    }
  }
  revalidatePath("/app/settings/security");
  revalidatePath("/app/in/customers");
  return {
    ok: added > 0,
    added,
    skipped: skipped.slice(0, 20),
    message: added ? `${added} ${added === 1 ? "customer" : "customers"} added${skipped.length ? `, ${skipped.length} skipped` : ""}.` : `Nothing added: ${skipped.length} ${skipped.length === 1 ? "row was" : "rows were"} skipped.`,
  };
}
