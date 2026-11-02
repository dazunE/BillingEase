"use server";

import { mileage, practice, properties } from "@billingease/contracts";
import { parseMiles, parseMoney } from "@billingease/core";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";

const money = (v: string | undefined) => parseMoney((v ?? "").replace(/[^\d.-]/g, "") || "0") ?? 0;

// ---- Property -----------------------------------------------------------------------------

export async function saveProperty(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const body = { name: v.name ?? "", address: v.address || null, sharePct: Number(v.sharePct || 100), monthlyRent: money(v.monthlyRent), rentDay: v.rentDay ? Number(v.rentDay) : null, agent: v.agent || null };
  try {
    if (v.id) await call(properties.update, { params: { id: v.id }, body });
    else await call(properties.create, { body });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app/out/properties");
  return { ok: true, message: v.id ? "Saved." : `${body.name} added.` };
}

export async function addPropertyEntry(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(properties.addEntry, {
      params: { id: v.propertyId ?? "" },
      body: { kind: v.kind === "rent" ? "rent" : "cost", on: v.on ?? "", description: v.description ?? "", payee: v.payee || null, categoryId: v.kind === "rent" ? null : v.categoryId || null, amount: money(v.amount), method: v.method || "Bank transfer" },
    });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app/out/properties");
  return { ok: true, message: v.kind === "rent" ? "Rent recorded." : "Cost recorded." };
}

export async function removePropertyEntry(fd: FormData) {
  await call(properties.removeEntry, { params: { entryId: String(fd.get("id")) } });
  revalidatePath("/app/out/properties");
}

// ---- Mileage ------------------------------------------------------------------------------

export async function logTrip(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const miles = parseMiles(v.miles ?? "");
  if (!miles) return { errors: { miles: "Enter the miles, like 25 or 12.5" }, values: v };
  try {
    await call(mileage.add, { body: { on: v.on ?? "", from: v.from ?? "", to: v.to ?? "", purpose: v.purpose || null, miles, vehicle: (v.vehicle as "car") || "car", returnTrip: v.returnTrip === "on" } });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app/out/mileage");
  return { ok: true, message: "Trip logged." };
}

export async function removeTrip(fd: FormData) {
  await call(mileage.remove, { params: { id: String(fd.get("id")) } });
  revalidatePath("/app/out/mileage");
}

// ---- Your accountant ----------------------------------------------------------------------

export async function sendMessage(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(practice.sendMessage, { body: { body: v.body ?? "" } });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app/accountant");
  return { ok: true };
}

export async function askFor(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(practice.createRequest, { body: { title: v.title ?? "", body: v.body || null, link: v.link || null } });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app/accountant", "layout");
  return { ok: true, message: "Request sent." };
}

export async function setRequest(fd: FormData) {
  await call(practice.setRequest, { params: { id: String(fd.get("id")) }, body: { status: fd.get("status") === "open" ? "open" : "done" } });
  revalidatePath("/app/accountant", "layout");
}
