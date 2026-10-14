import { comingIn } from "@billingease/contracts";
import { today } from "@billingease/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crumbs } from "@/components/in/bits";
import { editorBusiness, editorCustomers } from "@/components/in/data";
import { DocEditor } from "@/components/in/DocEditor";
import { lineFromStored } from "@/components/in/lines";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { saveInvoice } from "../../../actions";

export const metadata: Metadata = { title: "Edit draft invoice" };

export default async function EditInvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const inv = await load(comingIn.getInvoice, { params: { id } });
  if (inv.status !== "draft") redirect(`/app/in/invoices/${id}`);
  const [customers, items, summary] = await Promise.all([load(comingIn.listCustomers, { query: { archived: "all" } }), load(comingIn.listItems), load(comingIn.summary)]);
  return (
    <>
      <Crumbs trail={[{ label: "Coming in", href: "/app/in" }, { label: "All invoices", href: "/app/in/invoices" }, { label: "Edit draft" }]} />
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-bold text-ink2"><span className="size-2 rounded-full bg-coming" aria-hidden />Draft · becomes {summary.numbers.invoice} when you send it</span>
        <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">Edit draft for {inv.customer.name}</h1>
        {sp.from === "quote" && inv.quote && <p className="text-ink2">Made from quote {inv.quote.number}. Check the lines and dates, then send it.</p>}
      </div>
      <DocEditor
        mode="invoice"
        business={editorBusiness(b)}
        customers={editorCustomers(customers.customers)}
        items={items.items}
        number={summary.numbers.invoice}
        today={today()}
        initial={{
          id: inv.id, customerId: inv.customerId, issueDate: inv.issueDate, supplyDate: inv.supplyDate, dueDate: inv.dueDate, termsDays: b.termsDays,
          notes: inv.notes, reference: inv.reference,
          lines: inv.lines.map((l) => lineFromStored({ ...l, sscl: l.sscl })),
        }}
        action={saveInvoice}
        cancelHref={`/app/in/invoices/${id}`}
      />
    </>
  );
}
