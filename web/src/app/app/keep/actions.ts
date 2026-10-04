"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { redirectWithFlash } from "@/lib/flash";
import { OpError, setTaxRate } from "@/lib/ops";

/** Rates offered on the "Yours to keep" segmented control, in basis points. */
const ALLOWED = [1500, 2000, 2500, 3000, 3500];

export async function setTaxRateAction(formData: FormData) {
  const { business, db } = await requireBusiness();
  const bps = Number(formData.get("bps"));
  if (!ALLOWED.includes(bps)) redirectWithFlash("/app/keep", "Choose one of the rates shown.");
  try {
    await db.transaction((tx) => setTaxRate(tx, business.id, bps));
  } catch (err) {
    if (err instanceof OpError) redirectWithFlash("/app/keep", err.message);
    throw err;
  }
  revalidatePath("/app", "layout");
  redirectWithFlash("/app/keep", `Tax set-aside changed to ${bps / 100}% of profit`);
}
