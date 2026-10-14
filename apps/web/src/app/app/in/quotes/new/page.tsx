import { comingIn } from "@billingease/contracts";
import { today } from "@billingease/core";
import type { Metadata } from "next";
import { editorBusiness, editorCustomers } from "@/components/in/data";
import { DocEditor } from "@/components/in/DocEditor";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { saveQuote } from "../../actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "New quote" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const [customers, items, summary] = await Promise.all([load(comingIn.listCustomers), load(comingIn.listItems), load(comingIn.summary)]);
  const now = today();
  return (
    <>
      <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "Quotes", href: "/app/in/quotes" }, { label: "New quote" }]} />
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-bold text-ink2"><span className="size-2 rounded-full bg-coming" aria-hidden />{summary.numbers.quote} · Not saved yet</span>
        <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">New quote</h1>
        <p className="max-w-[640px] text-ink2">Your customer gets a PDF. When they say yes, mark it accepted and turn it into an invoice.</p>
      </div>
      <DocEditor mode="quote" business={editorBusiness(b)} customers={editorCustomers(customers.customers)} items={items.items} number={summary.numbers.quote} today={now}
        initial={{ customerId: customers.customers.some((c) => c.id === sp.customer) ? sp.customer : undefined, issueDate: now, termsDays: b.termsDays, lines: [] }}
        action={saveQuote} cancelHref="/app/in/quotes" />
    </>
  );
}
