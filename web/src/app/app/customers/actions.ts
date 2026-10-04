"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth";
import { redirectWithFlash } from "@/lib/flash";
import { createCustomer, OpError } from "@/lib/ops";
import { updateCustomer } from "@/lib/ops-in";

export type CustomerState = { errors?: Record<string, string>; values?: Record<string, string> } | undefined;

const schema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(200, "That name is too long."),
  email: z.union([z.literal(""), z.email("That email doesn't look right.")]),
  phone: z.string().trim().max(40, "That phone number is too long."),
  address: z.string().trim().max(500, "That address is too long."),
});

function parse(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const values = { name: get("name"), email: get("email").toLowerCase(), phone: get("phone"), address: get("address") };
  const parsed = schema.safeParse(values);
  if (parsed.success) return { data: parsed.data, values };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
  return { errors, values };
}

export async function createCustomerAction(_prev: CustomerState, formData: FormData): Promise<CustomerState> {
  const { business, db } = await requireBusiness();
  const { data, errors, values } = parse(formData);
  if (!data) return { errors, values };
  let id: string;
  try {
    id = (await createCustomer(db, business.id, data)).id;
  } catch (err) {
    if (err instanceof OpError) return { errors: { form: err.message }, values };
    throw err;
  }
  revalidatePath("/app", "layout");
  redirectWithFlash(`/app/customers/${id}`, `Added ${data.name}`);
}

export async function updateCustomerAction(customerId: string, _prev: CustomerState, formData: FormData): Promise<CustomerState> {
  const { business, db } = await requireBusiness();
  if (!z.uuid().safeParse(customerId).success) return { errors: { form: "Customer not found." } };
  const { data, errors, values } = parse(formData);
  if (!data) return { errors, values };
  try {
    await updateCustomer(db, business.id, customerId, data);
  } catch (err) {
    if (err instanceof OpError) return { errors: { form: err.message }, values };
    throw err;
  }
  revalidatePath("/app", "layout");
  redirectWithFlash(`/app/customers/${customerId}`, "Saved");
}
