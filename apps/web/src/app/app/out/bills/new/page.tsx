import { goingOut } from "@billingease/contracts";
import { formatMoney } from "@billingease/core";
import type { Metadata } from "next";
import { BillForm } from "@/components/out/BillForm";
import { BillsAside } from "@/components/out/BillsAside";
import { load } from "@/lib/api";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Enter a bill" };

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ supplier?: string }> }) {
  const { supplier } = await searchParams;
  const [setup, bills, suppliers] = await Promise.all([load(goingOut.setup), load(goingOut.bills), load(goingOut.suppliers)]);
  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Bills", href: "/app/out/bills" }, { label: "New bill" }]} />
      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        <div className="order-last lg:order-none"><BillsAside bills={bills.bills} currency={setup.currency} /></div>
        <section className="rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]" aria-labelledby="new-bill-h">
          <h1 id="new-bill-h" className="font-display text-[clamp(24px,3vw,30px)] font-bold tracking-[-0.02em]">Enter a bill</h1>
          <p className="mb-5 mt-1 text-[15px] text-ink2">
            Who sent it, when it&apos;s due and what it&apos;s for, as it says on the bill. {bills.totals.openCount > 0 && `You have ${formatMoney(bills.totals.open, setup.currency)} in ${bills.totals.openCount} open bill${bills.totals.openCount === 1 ? "" : "s"}.`}
          </p>
          <BillForm setup={setup} suppliers={suppliers.suppliers.map((s) => s.name)} supplierName={supplier} />
        </section>
      </div>
    </>
  );
}
