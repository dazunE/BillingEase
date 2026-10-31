import { comingIn } from "@billingease/contracts";
import { formatDate, describeRate } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIn, Notice, Panel, QuoteBadge, fmt2 } from "@/components/in/bits";
import { DONE, quotePreview } from "@/components/in/data";
import { DocPreview } from "@/components/in/DocPreview";
import { Button, ButtonLink, Field, ICONS, Icon, Input } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { convertQuote, decideQuote, deleteQuote, sendQuote } from "../../actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Quote" };

export default async function QuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const q = await load(comingIn.getQuote, { params: { id } });
  const name = q.number ?? "Draft quote";
  const hasEmail = !!q.customer.email;
  const pdf = `/app/in/quotes/${q.id}/pdf`;
  const open = q.status === "draft" || q.status === "sent";

  return (
    <>
      <AppCrumbs area="in" trail={[{ label: "Coming in", href: "/app/in" }, { label: "Quotes", href: "/app/in/quotes" }, { label: name }]} />
      <Notice done={sp.done} error={sp.error} messages={DONE} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="order-2 min-w-0 lg:order-1"><DocPreview d={quotePreview(q, b)} /></div>
        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="text-sm text-ink2">{name} · Quote</span>
                <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em]"><Link href={`/app/in/customers/${q.customerId}`} className="hover:underline">{q.customer.name}</Link></h1>
                {q.summary && <span className="text-[15px] text-ink2">{q.summary}</span>}
              </div>
              <QuoteBadge q={q} />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-bg p-4">
              <div className="flex flex-col"><span className="text-sm font-bold">Quote total</span><span className="tabular font-display text-[32px] font-bold leading-tight">{fmt2(q.total, q.currency, b.currency)}</span>{q.currency !== b.currency && <span className="text-sm text-ink2">About {fmt2(q.homeTotal, b.currency)} at {describeRate(q.currency, b.currency, q.fxRate)}</span>}</div>
              <div className="flex flex-col items-end text-sm"><strong>Valid until {formatDate(q.expiryDate)}</strong>{q.sentAt && <span className="text-ink2">Sent {formatDate(q.sentAt.slice(0, 10))}</span>}</div>
            </div>

            {q.status === "draft" && (
              <div className="flex flex-wrap gap-2">
                {hasEmail && <form action={sendQuote.bind(null, q.id, true)}><Button><Icon d={ICONS.send} size={18} />Send to {q.customer.email}</Button></form>}
                <form action={sendQuote.bind(null, q.id, false)}><Button variant={hasEmail ? "secondary" : "primary"}>Mark as sent</Button></form>
              </div>
            )}
            {(q.status === "sent" || q.status === "draft" || q.status === "declined") && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">What did they say?</span>
                <div className="flex flex-wrap gap-2">
                  <form action={decideQuote.bind(null, q.id, "accepted")}><Button variant={q.status === "sent" ? "primary" : "secondary"}>Mark accepted</Button></form>
                  {q.status !== "declined" && (
                    <details>
                      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">Mark declined</summary>
                      <form action={decideQuote.bind(null, q.id, "declined")} className="mt-2 flex flex-col gap-2 rounded-2xl bg-bg p-3">
                        <Field label="What they said" hint="Optional, for your records"><Input name="note" /></Field>
                        <Button variant="dark" className="self-start">Mark declined</Button>
                      </form>
                    </details>
                  )}
                </div>
              </div>
            )}
            {q.status === "accepted" && (
              <form action={convertQuote.bind(null, q.id)} className="flex flex-col gap-2">
                <p className="text-sm text-ink2">Accepted. Turn it into a draft invoice with the same lines, check it and send it.</p>
                <Button className="self-start">Turn into an invoice</Button>
              </form>
            )}
            {q.status === "invoiced" && q.invoiceId && (
              <ButtonLink href={`/app/in/invoices/${q.invoiceId}`} variant="secondary">See {q.invoiceNumber ?? "the invoice"}</ButtonLink>
            )}
            <div className="flex flex-wrap items-center gap-x-5 border-t border-line pt-3 text-[15px] font-semibold">
              {open && <Link href={`/app/in/quotes/${q.id}/edit`} className="flex min-h-11 items-center gap-1.5 hover:underline">Edit</Link>}
              <a href={pdf} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1.5 hover:underline"><Icon d={ICONS.doc} size={18} />See the PDF</a>
              <a href={`${pdf}?download=1`} className="flex min-h-11 items-center gap-1.5 hover:underline"><Icon d={ICONS.download} size={18} />Download PDF</a>
              {q.status === "sent" && hasEmail && <form action={sendQuote.bind(null, q.id, true)}><button className="flex min-h-11 items-center gap-1.5 hover:underline"><Icon d={ICONS.mail} size={18} />Email it again</button></form>}
            </div>
          </section>
          <p className="flex gap-2 rounded-2xl bg-tint px-4 py-3 text-sm"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-coming" aria-hidden />Quotes don&apos;t count in Coming in. Customers reply to you directly; there&apos;s no online acceptance.</p>
        </div>
      </div>

      <Panel title="What's happened">
        {q.activity.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
          <ol className="flex flex-col gap-2.5">
            {q.activity.map((a, i) => (
              <li key={i} className="flex items-start justify-between gap-4 text-[15px]">
                <span className="flex items-start gap-2.5"><span className="mt-2 size-2 shrink-0 rounded-full bg-coming" aria-hidden />{a.message}</span>
                <span className="shrink-0 text-sm text-muted">{formatDate(a.at.slice(0, 10))}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      {q.status === "draft" && (
        <details className="self-start">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-[15px] font-semibold text-late underline [&::-webkit-details-marker]:hidden">Delete this draft</summary>
          <form action={deleteQuote.bind(null, q.id)} className="mt-2 flex max-w-[480px] flex-col gap-3 rounded-2xl bg-late-bg p-4 text-sm">
            <span>Delete the draft quote? It was never sent.</span>
            <Button variant="dark" className="self-start">Delete draft</Button>
          </form>
        </details>
      )}
      <AlsoIn />
    </>
  );
}
