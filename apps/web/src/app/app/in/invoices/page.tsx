import { comingIn } from "@billingease/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIn, Chip, Crumbs, Empty, HeroCard, InvoiceLine, Tabs, fmt } from "@/components/in/bits";
import { Button, ButtonLink, Field, ICONS, Icon, Input, Select } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "All invoices" };

type Search = { status?: string; q?: string; customerId?: string; from?: string; to?: string; kind?: string };
const STATUSES = ["unpaid", "late", "draft", "paid", "void", "all"] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "unpaid";
  const query = {
    status: status as "all", q: sp.q || undefined, customerId: sp.customerId || undefined,
    from: sp.from && DATE.test(sp.from) ? sp.from : undefined, to: sp.to && DATE.test(sp.to) ? sp.to : undefined,
  };
  const [list, unpaid, customers] = await Promise.all([
    load(comingIn.listInvoices, { query }),
    load(comingIn.listInvoices, { query: { status: "unpaid" } }),
    load(comingIn.listCustomers, { query: { archived: "all" } }),
  ]);
  const cur = b.currency;
  const href = (s: string) => {
    const p = new URLSearchParams();
    p.set("status", s);
    for (const k of ["q", "customerId", "from", "to"] as const) if (query[k]) p.set(k, query[k]!);
    return `/app/in/invoices?${p}`;
  };
  const filtered = !!(query.q || query.customerId || query.from || query.to);
  const lk = b.country === "lk";

  return (
    <>
      <Crumbs trail={[{ label: "Coming in", href: "/app/in" }, { label: "All invoices" }]} />
      <HeroCard
        title="All invoices"
        intro="Every invoice you've sent, started or been paid for. Pick one to see where it stands, record a payment or send a reminder."
        chips={<>
          <Chip label="Left to collect" value={fmt(unpaid.totals.open, cur)} />
          <Chip tone="late" label="Late" value={fmt(unpaid.totals.late, cur)} />
          <Chip tone="light" label="Drafts" value={`${list.counts.draft}`} />
        </>}
        aside={<>
          <p>{lk && b.vatRegistered ? "Tax Invoices" : "Invoices"} count in Coming in as money on the way once you send them, and as received when you record the payment. Drafts don&apos;t count.</p>
          <ButtonLink href="/app/in/invoices/new"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />New invoice</ButtonLink>
        </>}
      />

      <div className="flex flex-col gap-4">
        <Tabs current={status} tabs={[
          { key: "unpaid", label: "Unpaid", count: list.counts.unpaid, href: href("unpaid") },
          { key: "late", label: "Late", count: list.counts.late, href: href("late") },
          { key: "draft", label: "Drafts", count: list.counts.draft, href: href("draft") },
          { key: "paid", label: "Paid", count: list.counts.paid, href: href("paid") },
          { key: "void", label: "Void", count: list.counts.void, href: href("void") },
          { key: "all", label: "All", count: list.counts.all, href: href("all") },
        ]} />
        <form method="get" action="/app/in/invoices" className="grid gap-3 rounded-3xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr_auto]">
          <input type="hidden" name="status" value={status} />
          <Field label="Search"><Input name="q" defaultValue={query.q} placeholder="Customer, number or what it's for" /></Field>
          <Field label="Customer">
            <Select name="customerId" defaultValue={query.customerId ?? ""}>
              <option value="">Everyone</option>
              {customers.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Dated from"><Input type="date" name="from" defaultValue={query.from} /></Field>
          <Field label="to"><Input type="date" name="to" defaultValue={query.to} /></Field>
          <div className="flex items-end gap-2">
            <Button variant="secondary"><Icon d={ICONS.search} size={18} />Show</Button>
            {filtered && <Link href={`/app/in/invoices?status=${status}`} className="flex min-h-11 items-center font-semibold underline">Clear</Link>}
          </div>
        </form>
      </div>

      {list.invoices.length === 0 ? (
        <Empty>{filtered ? "No invoices match." : status === "late" ? "Nothing is late." : status === "draft" ? "No drafts." : "No invoices here yet."} <Link href="/app/in/invoices/new" className="font-semibold underline">New invoice</Link></Empty>
      ) : (
        <section aria-label="Invoices" className="flex flex-col gap-2">
          <ul className="flex flex-col rounded-3xl border border-line bg-white p-2">
            {list.invoices.map((r) => <InvoiceLine key={r.id} r={r} currency={cur} />)}
          </ul>
          <div className="flex flex-wrap justify-between gap-2 px-2 text-sm text-ink2">
            <span>{list.totals.count} invoice{list.totals.count === 1 ? "" : "s"}</span>
            <span>Total <strong className="tabular text-ink">{fmt(list.totals.total, cur)}</strong> · left to collect <strong className="tabular text-ink">{fmt(list.totals.open, cur)}</strong>{list.totals.late ? <> · late <strong className="tabular text-late">{fmt(list.totals.late, cur)}</strong></> : null}</span>
          </div>
        </section>
      )}
      <AlsoIn except="/app/in/invoices" />
    </>
  );
}
