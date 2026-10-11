"use server";

import { business } from "@billingease/contracts";
import { redirect } from "next/navigation";
import { call } from "@/lib/api";
import { blankToNull, checked, failed, formValues, type FormState } from "@/lib/form";
import { chooseBusiness } from "@/lib/session";

export async function createBusiness(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const country = v.country === "lk" ? "lk" : "uk";
  try {
    const b = await call(business.create, {
      body: {
        country,
        kind: (v.kind || (country === "uk" ? "sole_trader" : "sole_proprietor")) as "sole_trader",
        name: v.name ?? "",
        ownerName: v.ownerName ?? "",
        taxId: blankToNull(v.taxId),
        vatRegistered: checked(v.vatRegistered),
        vatNumber: blankToNull(v.vatNumber),
        ssclRegistered: country === "lk" && checked(v.ssclRegistered),
        basis: v.basis === "accrual" ? "accrual" : v.basis === "cash" ? "cash" : undefined,
        quarterType: v.quarterType === "calendar" ? "calendar" : "standard",
      },
    });
    await chooseBusiness(b.id);
  } catch (err) {
    return failed(err, v);
  }
  redirect("/app");
}
