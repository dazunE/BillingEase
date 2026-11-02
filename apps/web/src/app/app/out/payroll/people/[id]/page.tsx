import { payroll } from "@billingease/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Panel } from "@/components/keep/parts";
import { EmployeeForm } from "@/components/out/PayrollForms";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Someone on payroll" };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business: b } = await requireBusiness();
  const o = await load(payroll.overview);
  const e = o.employees.find((x) => x.id === id);
  if (!e) notFound();
  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Payroll", href: "/app/out/payroll" }, { label: e.name }]} />
      <Panel id="person-h" title={e.name} sub={o.mode === "full" ? "Changes apply to runs you prepare from now; approved runs and payslips stay as they were." : "Their figures for each run come from your payroll software."}>
        <EmployeeForm mode={o.mode} employee={e} currency={b.currency} />
      </Panel>
    </>
  );
}
