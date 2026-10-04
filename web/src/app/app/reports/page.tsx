import { redirect } from "next/navigation";

// Reports live behind "Yours to keep" → "Ready for your accountant".
export default function ReportsIndex() {
  redirect("/app/keep#acct-h");
}
