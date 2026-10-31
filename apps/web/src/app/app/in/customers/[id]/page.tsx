import { comingIn } from "@billingease/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIn, Avatar, Empty, FREQ, InvoiceLine, Notice, Panel, QuoteBadge, fmt } from "@/components/in/bits";
import { DONE } from "@/components/in/data";
import { CustomerForm } from "@/components/in/forms";
import { Badge, Button, ButtonLink, ICONS, Icon } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { archiveCustomer, saveCustomer } from "../../actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const d = await load(comingIn.getCustomer, { params: { id } });
  const c = d.customer;
  const cur = b.currency;
  const lk = b.country === "lk";
  const since = new Date(c.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <>
      <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "Customers", href: "/app/in/customers" }, { label: c.name }]} />
      <Notice done={sp.done} error={sp.error} messages={DONE} />
      <section className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,32px)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={c.name} className="size-14 text-lg" />
            <div className="flex min-w-0 flex-col">
              <h1 className="font-display text-[clamp(26px,3.5vw,36px)] font-bold leading-tight tracking-[-0.02em]">{c.name}</h1>
              <span className="flex flex-wrap items-center gap-2 text-sm text-ink2">Customer since {since}{c.late > 0 && <Badge tone="late">{fmt(c.late, cur)} late</Badge>}{c.archived && <Badge>Archived</Badge>}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/app/in/invoices/new?customer=${c.id}`}><Icon d={ICONS.doc} size={18} />Bill them</ButtonLink>
            <ButtonLink href={`/app/in/quotes/new?customer=${c.id}`} variant="secondary">Send a quote</ButtonLink>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5 rounded-2xl bg-bg p-4"><span className="text-sm font-bold">Owes you</span><span className="tabular font-display text-[24px] font-bold">{fmt(c.owed, cur)}</span><span className="text-sm text-muted">{c.openCount} open invoice{c.openCount === 1 ? "" : "s"}</span></div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-bg p-4"><span className="text-sm font-bold">Late</span><span className={`tabular font-display text-[24px] font-bold ${c.late ? "text-late" : ""}`}>{fmt(c.late, cur)}</span><span className="text-sm text-muted">Past the due date</span></div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-bg p-4"><span className="text-sm font-bold">Paid you this year</span><span className="tabular font-display text-[24px] font-bold">{fmt(d.paidThisYear, cur)}</span><span className="text-sm text-muted">{lk ? "Year of assessment" : "Tax year"} {d.yearLabel} · {fmt(c.paid, cur)} in all</span></div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title={<>Invoices <span className="text-muted">{d.invoices.length}</span></>} aside={<Link href={`/app/in/invoices/new?customer=${c.id}`} className="text-sm font-semibold underline">Bill them</Link>}>
            {d.invoices.length === 0 ? <Empty>No invoices yet.</Empty> : <ul className="flex flex-col">{d.invoices.map((r) => <InvoiceLine key={r.id} r={r} currency={cur} showCustomer={false} />)}</ul>}
          </Panel>
          <Panel title={<>Quotes <span className="text-muted">{d.quotes.length}</span></>} aside={<Link href={`/app/in/quotes/new?customer=${c.id}`} className="text-sm font-semibold underline">Send a quote</Link>}>
            {d.quotes.length === 0 ? <Empty>No quotes yet.</Empty> : (
              <ul className="flex flex-col">
                {d.quotes.map((q) => (
                  <li key={q.id}><Link href={`/app/in/quotes/${q.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-3 py-3 hover:bg-bg"><span className="flex min-w-0 flex-1 flex-col"><strong>{q.number ?? "Draft"}{q.summary ? ` · ${q.summary}` : ""}</strong></span><QuoteBadge q={q} /><strong className="tabular">{fmt(q.total, q.currency, cur)}</strong></Link></li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={<>Repeating invoices <span className="text-muted">{d.recurring.length}</span></>} aside={<Link href={`/app/in/repeating/new?customer=${c.id}`} className="text-sm font-semibold underline">Set one up</Link>}>
            {d.recurring.length === 0 ? <Empty>None.</Empty> : (
              <ul className="flex flex-col">
                {d.recurring.map((r) => (
                  <li key={r.id}><Link href={`/app/in/repeating/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-3 py-3 hover:bg-bg"><span className="flex min-w-0 flex-1 flex-col"><strong>{r.name}</strong><span className="text-sm text-muted">{FREQ[r.frequency]} · {r.invoiceCount} sent so far</span></span><Badge tone={r.active ? "pos" : "due"}>{r.active ? "Active" : "Paused"}</Badge><strong className="tabular">{fmt(r.total, r.currency, cur)}</strong></Link></li>
                ))}
              </ul>
            )}
          </Panel>
          {d.creditNotes.length > 0 && (
            <Panel title={<>Credit notes <span className="text-muted">{d.creditNotes.length}</span></>}>
              <ul className="flex flex-col">{d.creditNotes.map((r) => <InvoiceLine key={r.id} r={r} currency={cur} showCustomer={false} />)}</ul>
            </Panel>
          )}
        </div>
        <Panel id="details" title="Contact details">
          <CustomerForm action={saveCustomer.bind(null, c.id)} country={b.country} customer={c} />
          <form action={archiveCustomer.bind(null, c.id, !c.archived)} className="border-t border-line pt-3">
            <Button variant="ghost">{c.archived ? "Bring back from the archive" : "Archive this customer"}</Button>
            {!c.archived && <p className="text-xs text-muted">Archived customers are hidden from lists; their invoices stay.</p>}
          </form>
        </Panel>
      </div>
      <AlsoIn />
    </>
  );
}
