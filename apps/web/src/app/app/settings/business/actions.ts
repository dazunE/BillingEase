"use server";

import { business } from "@billingease/contracts";
import { revalidatePath } from "next/cache";
import { call } from "@/lib/api";
import { blankToNull, checked, failed, formValues, type FormState } from "@/lib/form";

export async function saveProfile(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const uk = v.country === "uk";
  const terms = Number(v.termsDays);
  try {
    await call(business.update, {
      body: {
        name: v.name ?? "",
        legalName: blankToNull(v.legalName),
        ownerName: v.ownerName ?? "",
        email: blankToNull(v.email),
        phone: blankToNull(v.phone),
        addressLine1: blankToNull(v.addressLine1),
        addressLine2: blankToNull(v.addressLine2),
        town: blankToNull(v.town),
        region: blankToNull(v.region),
        postcode: blankToNull(v.postcode),
        kind: v.kind as "sole_trader",
        taxId: blankToNull(v.taxId),
        vatRegistered: checked(v.vatRegistered),
        vatNumber: blankToNull(v.vatNumber),
        ...(uk
          ? { basis: v.basis === "accrual" ? "accrual" : "cash", quarterType: v.quarterType === "calendar" ? "calendar" : "standard" }
          : { ssclRegistered: checked(v.ssclRegistered) }),
        invoicePrefix: v.invoicePrefix ?? "",
        termsDays: Number.isFinite(terms) ? terms : -1,
        paymentDetails: blankToNull(v.paymentDetails),
        invoiceNote: blankToNull(v.invoiceNote),
        accent: v.accent ?? "",
      },
    });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: "Saved. New invoices use these details; ones already sent stay as they were.", values: v };
}
