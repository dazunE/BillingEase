import { redirect } from "next/navigation";

// Budgets live in the phone app for now; their notifications link here. On the web, Going out
// is the nearest page.
export default function BudgetsPage() {
  redirect("/app/out");
}
