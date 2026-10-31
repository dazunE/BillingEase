import { comingIn } from "@billingease/contracts";
import { formatDate, today, currencyDigits } from "@billingease/core";
import type { Metadata } from "next";
import { AlsoIn, Empty, FREQ, InvoiceLine, Notice, Panel, fmt } from "@/components/in/bits";
import { DONE, editorBusiness, editorCustomers } from "@/components/in/data";
import { DocEditor } from "@/components/in/DocEditor";
import { lineFromStored } from "@/components/in/lines";
import { Badge, Button } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { deleteRecurring, pauseRecurring, runRecurring, saveRecurring } from "../../actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Repeating invoice" };

export default async function RepeatingDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const [r, customers, items] = await Promise.all([load(comingIn.getRecurring, { params: { id } }), load(comingIn.listCustomers, { query: { archived: "all" } }), load(comingIn.listItems)]);
  const cur = b.currency;
  return (
    <>
      <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "Repeating", href: "/app/in/repeating" }, { label: r.name }]} />
      <Notice done={sp.done} error={sp.error} messages={DONE} />
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2"><h1 className="font-display text-[clamp(26px,3.5vw,34px)] font-bold tracking-[-0.02em]">{r.name}</h1><Badge tone={r.active ? "pos" : "due"}>{r.active ? "Active" : "Paused"}</Badge></span>
          <span className="text-[15px] text-ink2">{r.customerName} · {fmt(r.total, r.currency, cur)} {FREQ[r.frequency]} · {r.mode === "send" ? "sent on the day" : "makes a draft for you to check"}</span>
          <span className="text-sm text-muted">{r.active && r.upcoming[0] ? `Next on ${formatDate(r.upcoming[0], { year: true })}` : "Paused: nothing is made until you resume."}{r.endDate ? ` · stops after ${formatDate(r.endDate, { year: true })}` : ""}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {r.active && <form action={runRecurring.bind(null, r.id)}><Button>{r.mode === "send" ? "Send the next one now" : "Make the next one now"}</Button></form>}
          <form action={pauseRecurring.bind(null, r.id, !r.active)}><Button variant="secondary">{r.active ? "Pause" : "Resume"}</Button></form>
        </div>
      </section>

      <Panel title="Invoices it has made" aside={<span className="text-sm text-muted">{r.invoices.length}</span>}>
        {r.invoices.length === 0 ? <Empty>None yet.</Empty> : <ul className="flex flex-col">{r.invoices.map((i) => <InvoiceLine key={i.id} r={i} currency={cur} showCustomer={false} />)}</ul>}
      </Panel>

      <h2 className="font-display text-[22px] font-bold">Change it</h2>
      <DocEditor mode="repeating" business={editorBusiness(b)} customers={editorCustomers(customers.customers)} items={items.items} number="" today={today()}
        initial={{ id: r.id, customerId: r.customerId, issueDate: r.nextRun, nextRun: r.nextRun, endDate: r.endDate, termsDays: r.termsDays, name: r.name, frequency: r.frequency, recurMode: r.mode, notes: r.notes, reference: r.reference, currency: r.currency, lines: r.lines.map((l) => lineFromStored(l, currencyDigits(r.currency))) }}
        action={saveRecurring} cancelHref="/app/in/repeating" />

      <details className="self-start">
        <summary className="flex min-h-11 cursor-pointer list-none items-center text-[15px] font-semibold text-late underline [&::-webkit-details-marker]:hidden">Delete this repeating invoice</summary>
        <form action={deleteRecurring.bind(null, r.id)} className="mt-2 flex max-w-[480px] flex-col gap-3 rounded-2xl bg-late-bg p-4 text-sm">
          <span>Stop and delete it? Invoices it already made stay as they are.</span>
          <Button variant="dark" className="self-start">Delete</Button>
        </form>
      </details>
      <AlsoIn />
    </>
  );
}
