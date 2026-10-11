import { comingIn } from "@billingease/contracts";
import { invoiceTitle, rulesFor, today } from "@billingease/core";
import type { Metadata } from "next";
import { Crumbs } from "@/components/in/bits";
import { editorBusiness, editorCustomers } from "@/components/in/data";
import { DocEditor } from "@/components/in/DocEditor";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { saveInvoice } from "../../actions";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const [customers, items, summary] = await Promise.all([
    load(comingIn.listCustomers),
    load(comingIn.listItems),
    load(comingIn.summary),
  ]);
  const title = invoiceTitle(b.country, b.vatRegistered);
  const now = today();
  const rules = rulesFor(b.country);
  return (
    <>
      <Crumbs trail={[{ label: "Coming in", href: "/app/in" }, { label: "All invoices", href: "/app/in/invoices" }, { label: "New invoice" }]} />
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-bold text-ink2"><span className="size-2 rounded-full bg-coming" aria-hidden />{summary.numbers.invoice} · Not saved yet</span>
        <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">New {title}</h1>
        <p className="max-w-[640px] text-ink2">Several lines, products and services, a discount, {b.vatRegistered ? "VAT per line" : "notes"}{b.country === "lk" && b.ssclRegistered ? " and SSCL" : ""}. It gets its number when you send it.</p>
      </div>
      <DocEditor
        mode="invoice"
        business={editorBusiness(b)}
        customers={editorCustomers(customers.customers)}
        items={items.items}
        number={summary.numbers.invoice}
        today={now}
        initial={{ customerId: customers.customers.some((c) => c.id === sp.customer) ? sp.customer : undefined, issueDate: now, termsDays: b.termsDays, lines: [] }}
        action={saveInvoice}
        cancelHref="/app/in/invoices"
      />
      <p className="sr-only">{rules.name}</p>
    </>
  );
}
