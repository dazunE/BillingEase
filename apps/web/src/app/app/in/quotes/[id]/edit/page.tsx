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
import { saveQuote } from "../../../actions";

export const metadata: Metadata = { title: "Edit quote" };

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business: b } = await requireBusiness();
  const q = await load(comingIn.getQuote, { params: { id } });
  if (q.status !== "draft" && q.status !== "sent") redirect(`/app/in/quotes/${id}`);
  const [customers, items, summary] = await Promise.all([load(comingIn.listCustomers, { query: { archived: "all" } }), load(comingIn.listItems), load(comingIn.summary)]);
  return (
    <>
      <Crumbs trail={[{ label: "Coming in", href: "/app/in" }, { label: "Quotes", href: "/app/in/quotes" }, { label: `Edit ${q.number ?? "draft"}` }]} />
      <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">Edit {q.number ?? "draft quote"} for {q.customer.name}</h1>
      <DocEditor mode="quote" business={editorBusiness(b)} customers={editorCustomers(customers.customers)} items={items.items} number={q.number ?? summary.numbers.quote} today={today()}
        initial={{ id: q.id, customerId: q.customerId, issueDate: q.issueDate, expiryDate: q.expiryDate, termsDays: b.termsDays, notes: q.notes, lines: q.lines.map((l) => lineFromStored(l)) }}
        action={saveQuote} cancelHref={`/app/in/quotes/${id}`} />
    </>
  );
}
