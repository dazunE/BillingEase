import { comingIn } from "@billingease/contracts";
import { formatDate, monthLabel } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIn, Avatar, Crumbs, Dot, Empty, InvoiceBadge, InvoiceLine, Legend, SplitBar, ToolCard, fmt } from "@/components/in/bits";
import { ReminderForm } from "@/components/in/forms";
import { Badge, ButtonLink, ICONS, Icon, SectionTitle, cx } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { remind } from "./actions";

export const metadata: Metadata = { title: "Coming in" };

export default async function ComingInPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams;
  const period = sp.period === "month" || sp.period === "quarter" || sp.period === "year" ? sp.period : undefined;
  const { business: b } = await requireBusiness();
  const s = await load(comingIn.summary, { query: { period } });
  const cur = b.currency;
  const lk = b.country === "lk";
  const word = s.period.key === "month" ? `this ${monthLabel(s.period.from).split(" ")[0]}` : s.period.key === "quarter" ? `this quarter (${s.period.label})` : `in ${s.period.label.replace(/^Tax year/, "tax year").replace(/^Year/, "year")}`;

  return (
    <>
      <Crumbs trail={[{ label: "Coming in" }]} />

      <section className="flex flex-wrap items-end gap-x-8 gap-y-5 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5">
          <h1 className="flex items-center gap-2.5 text-base font-bold"><Dot />Coming in {word}</h1>
          <span className="tabular font-display text-[clamp(44px,6vw,64px)] font-bold leading-none tracking-[-0.03em]" data-testid="coming-in-total">{fmt(s.total, cur)}</span>
          <SplitBar received={s.received} onTheWay={s.onTheWay} />
          <Legend received={s.received} onTheWay={s.onTheWay} currency={cur} />
        </div>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col items-start gap-4 text-[15px] leading-relaxed text-ink2">
          <nav aria-label="Period" className="flex flex-wrap gap-1 rounded-full bg-surface p-1">
            {s.periods.map((p) => (
              <Link key={p.key} href={`/app/in?period=${p.key}`} aria-current={p.key === s.period.key ? "page" : undefined}
                className={cx("flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold", p.key === s.period.key ? "bg-white text-ink shadow-sm" : "text-ink2 hover:text-ink")}>
                {p.label}
              </Link>
            ))}
          </nav>
          <p>Everything customers paid you {word}, plus what they still owe on invoices you sent {word}. Record a payment when it reaches your bank, and it moves across.</p>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href="/app/in/invoices/new"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />New {lk && b.vatRegistered ? "Tax Invoice" : "invoice"}</ButtonLink>
            <ButtonLink href="/app/in/quotes/new" variant="secondary">New quote</ButtonLink>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="tools-h">
        <SectionTitle id="tools-h" aside="Invoices, quotes and customers">Tools for Coming in</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ToolCard href="/app/in/invoices" icon={ICONS.doc} title="Invoices" line="Every invoice, sent, paid or late"
            chip={s.counts.unpaid ? `${s.counts.unpaid} unpaid${s.counts.late ? ` · ${s.counts.late} late` : ""}` : s.counts.drafts ? `${s.counts.drafts} draft${s.counts.drafts === 1 ? "" : "s"}` : "All paid"} chipTone={s.counts.late ? "late" : s.counts.unpaid ? "due" : "neutral"} />
          <ToolCard href="/app/in/quotes" icon={ICONS.bill} title="Quotes" line="Price a job, mark it accepted"
            chip={s.counts.quotesWaiting ? `${s.counts.quotesWaiting} waiting for an answer` : "None waiting"} />
          <ToolCard href="/app/in/repeating" icon={ICONS.clock} title="Repeating" line="Regular invoices and credit notes"
            chip={`${s.counts.recurringActive} active`} />
          <ToolCard href="/app/in/customers" icon={ICONS.people} title="Customers" line="Who you work for and what they owe"
            chip={`${s.counts.customers} customer${s.counts.customers === 1 ? "" : "s"}`} chipTone={s.counts.late ? "due" : "neutral"} />
          <ToolCard href="/app/in/prices" icon={ICONS.card} title="Products and services" line="What you sell, with prices"
            chip={`${s.counts.items} item${s.counts.items === 1 ? "" : "s"}`} />
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="late-h">
        <SectionTitle id="late-h" aside={s.late ? `${fmt(s.late, cur)} past its due date` : undefined}>Late <span className="text-muted">{s.lateCount}</span></SectionTitle>
        {s.lateInvoices.length === 0 ? <Empty>Nothing is late. Nice.</Empty> : (
          <ul className="flex flex-col gap-3">
            {s.lateInvoices.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-3xl border border-line bg-white p-[clamp(16px,2.5vw,22px)]">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-late-bg text-late"><Icon d={ICONS.clock} /></span>
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2"><strong className="text-[17px]">{r.customerName}</strong><InvoiceBadge row={r} /></span>
                  <span className="text-sm text-ink2">{r.number}{r.summary ? ` · ${r.summary}` : ""}, due {formatDate(r.dueDate)}.{r.remindersSent ? ` You've sent ${r.remindersSent} reminder${r.remindersSent === 1 ? "" : "s"}, so a call may help.` : ""}</span>
                </div>
                <strong className="tabular text-[20px]">{fmt(r.open, cur)}</strong>
                <div className="flex flex-wrap items-center gap-2">
                  <ButtonLink href={`/app/in/invoices/${r.id}`} variant="secondary">See {r.number}</ButtonLink>
                  <ButtonLink href={`/app/in/invoices/${r.id}#pay`} variant="secondary">Record a payment</ButtonLink>
                  <ReminderForm action={remind.bind(null, r.id)} whatsapp={lk} hasEmail compact defaultMessage="" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="way-h">
        <SectionTitle id="way-h" aside={`${fmt(s.onTheWay, cur)} · ${b.termsDays}-day terms unless you chose otherwise`}>On the way <span className="text-muted">{s.onTheWayInvoices.length}</span></SectionTitle>
        {s.onTheWayInvoices.length === 0 ? <Empty>No invoices waiting to be paid {word}. <Link href="/app/in/invoices/new" className="font-semibold underline">Bill someone</Link>.</Empty> : (
          <ul className="flex flex-col rounded-3xl border border-line bg-white p-2">
            {s.onTheWayInvoices.map((r) => <InvoiceLine key={r.id} r={r} currency={cur} />)}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="recent-h">
        <SectionTitle id="recent-h" aside={<Link href="/app/in/invoices?status=all" className="font-semibold text-ink underline">All invoices</Link>}>Recent invoices</SectionTitle>
        {s.recent.length === 0 ? (
          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-dashed border-line bg-white p-6">
            <Avatar name="+" className="bg-tint" />
            <p className="flex-1 text-[15px] text-ink2">No invoices yet. Your first one will be <strong className="text-ink">{s.numbers.invoice}</strong>.</p>
            <ButtonLink href="/app/in/invoices/new">New invoice</ButtonLink>
          </div>
        ) : (
          <ul className="flex flex-col rounded-3xl border border-line bg-white p-2">
            {s.recent.map((r) => <InvoiceLine key={r.id} r={r} currency={cur} />)}
          </ul>
        )}
        {s.counts.drafts > 0 && <p className="text-sm text-ink2"><Badge tone="neutral">{s.counts.drafts} draft{s.counts.drafts === 1 ? "" : "s"}</Badge> <Link href="/app/in/invoices?status=draft" className="font-semibold underline">Check and send them</Link></p>}
      </section>

      <AlsoIn except="/app/in" />
    </>
  );
}
