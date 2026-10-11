import { comingIn } from "@billingease/contracts";
import { formatDate, rulesFor, today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIn, Crumbs, InvoiceBadge, Notice, Panel, fmt, fmt2 } from "@/components/in/bits";
import { DONE, invoicePreview } from "@/components/in/data";
import { DocPreview } from "@/components/in/DocPreview";
import { CreditNoteForm, PaymentForm, ReminderForm } from "@/components/in/forms";
import { Badge, Button, ButtonLink, Field, ICONS, Icon, Input } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { creditNote, deleteInvoice, emailInvoice, issueInvoice, recordPayment, remind, voidInvoice, voidPayment } from "../../actions";

export const metadata: Metadata = { title: "Invoice" };

function when(iso: string) {
  return formatDate(iso.slice(0, 10), { year: true });
}

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const inv = await load(comingIn.getInvoice, { params: { id } });
  const cur = b.currency;
  const rules = rulesFor(b.country);
  const lk = b.country === "lk";
  const now = today();
  const isCredit = inv.kind === "credit_note";
  const draft = inv.status === "draft";
  const live = !draft && inv.status !== "void" && !isCredit;
  const owed = live && inv.open > 0;
  const name = inv.number ?? "Draft";
  const hasEmail = !!inv.customer.email;
  const paidReceipts = inv.receipts.filter((r) => !r.voided);
  const pdf = `/app/in/invoices/${inv.id}/pdf`;
  const reminderDefault = [
    "Hello,", "",
    `A friendly reminder that invoice ${inv.number} ${inv.dueDate < now ? "was" : "is"} due on ${formatDate(inv.dueDate, { year: true })}, and ${fmt2(inv.open, cur)} is still to pay.`,
    ...(b.paymentDetails ? ["", `How to pay: ${b.paymentDetails}`] : []), "",
    "If you've already paid, thank you, and please ignore this.", "", b.name,
  ].join("\n");

  return (
    <>
      <Crumbs trail={[{ label: "Coming in", href: "/app/in" }, isCredit ? { label: "Credit notes", href: "/app/in/repeating#credit-notes" } : { label: "All invoices", href: "/app/in/invoices" }, { label: name }]} />
      <Notice done={sp.done} error={sp.error} messages={DONE} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="order-2 min-w-0 lg:order-1">
          <DocPreview d={invoicePreview(inv, b)} />
        </div>

        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="text-sm text-ink2">{name} · {inv.title}</span>
                <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em]"><Link href={`/app/in/customers/${inv.customerId}`} className="hover:underline">{inv.customer.name}</Link></h1>
                {inv.summary && <span className="text-[15px] text-ink2">{inv.summary}</span>}
              </div>
              <InvoiceBadge row={inv} />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-bg p-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold">{isCredit ? "Credited" : inv.status === "paid" ? "Paid in full" : inv.status === "void" ? "Voided" : draft ? "Comes to" : "Amount due"}</span>
                <span className="tabular font-display text-[34px] font-bold leading-tight tracking-[-0.02em]" data-testid="amount-due">{fmt2(isCredit || draft || inv.status === "paid" || inv.status === "void" ? inv.total : inv.open, cur)}</span>
              </div>
              <div className="flex flex-col items-end text-sm">
                {!isCredit && <strong>{inv.shown === "late" ? "Was due" : "Due"} {formatDate(inv.dueDate)}</strong>}
                {inv.sentAt && <span className="text-ink2">Sent {when(inv.sentAt)}</span>}
                {inv.paid > 0 && <span className="text-ink2">{fmt(inv.paid, cur)} received</span>}
                {inv.credited > 0 && <span className="text-ink2">{fmt(inv.credited, cur)} credited</span>}
              </div>
            </div>
            {inv.creditFor && <p className="text-sm">Takes money off <Link href={`/app/in/invoices/${inv.creditFor.id}`} className="font-semibold underline">{inv.creditFor.number}</Link>.</p>}
            {inv.quote && <p className="text-sm">Made from quote <Link href={`/app/in/quotes/${inv.quote.id}`} className="font-semibold underline">{inv.quote.number}</Link>.</p>}
            {inv.recurringId && <p className="text-sm">Made by a <Link href={`/app/in/repeating/${inv.recurringId}`} className="font-semibold underline">repeating invoice</Link>.</p>}

            {draft && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-ink2">A draft doesn&apos;t count anywhere yet. Sending it gives it the next number and adds it to Coming in.</p>
                <div className="flex flex-wrap gap-2">
                  {hasEmail && <form action={issueInvoice.bind(null, inv.id, true)}><Button><Icon d={ICONS.send} size={18} />Send to {inv.customer.email}</Button></form>}
                  <form action={issueInvoice.bind(null, inv.id, false)}><Button variant={hasEmail ? "secondary" : "primary"}>Mark as sent</Button></form>
                  <ButtonLink href={`/app/in/invoices/${inv.id}/edit`} variant="secondary">Edit</ButtonLink>
                </div>
                {!hasEmail && <p className="text-sm text-ink2">{inv.customer.name} has no email address. <Link href={`/app/in/customers/${inv.customerId}#details`} className="font-semibold underline">Add one</Link> to email it.</p>}
              </div>
            )}
            {owed && (
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="#pay"><Icon d={ICONS.plus} size={18} />Record a payment</ButtonLink>
                <ButtonLink href="#remind" variant="secondary">{lk ? "Send a reminder" : "Email a reminder"}</ButtonLink>
                <ButtonLink href="#credit" variant="secondary">Credit note</ButtonLink>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-3 text-[15px] font-semibold">
              <a href={pdf} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1.5 underline-offset-4 hover:underline"><Icon d={ICONS.doc} size={18} />See the PDF</a>
              <a href={`${pdf}?download=1`} className="flex min-h-11 items-center gap-1.5 underline-offset-4 hover:underline" data-testid="download-pdf"><Icon d={ICONS.download} size={18} />Download PDF</a>
              {!draft && inv.status !== "void" && hasEmail && (
                <form action={emailInvoice.bind(null, inv.id)}><button className="flex min-h-11 items-center gap-1.5 underline-offset-4 hover:underline"><Icon d={ICONS.mail} size={18} />Email the PDF</button></form>
              )}
            </div>
          </section>

          {owed && (
            <p className="flex gap-2 rounded-2xl bg-tint px-4 py-3 text-sm">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-coming" aria-hidden />
              When they pay, record it here and {fmt(inv.open, cur)} lands in Coming in as received on the day you record.
            </p>
          )}
        </div>
      </div>

      {owed && (
        <Panel id="pay" title="Record a payment" aside={<span className="text-sm text-muted">{rules.receiveMethods.join(", ")}</span>}>
          <PaymentForm action={recordPayment.bind(null, inv.id)} country={b.country} currency={cur} open={inv.open} today={now} />
        </Panel>
      )}

      {!isCredit && inv.receipts.length > 0 && (
        <Panel title="Payments">
          <ul className="flex flex-col divide-y divide-divider">
            {inv.receipts.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{fmt2(r.amount, cur)} by {r.method === "Cheque" && r.chequeNumber ? `cheque ${r.chequeNumber}` : r.method.toLowerCase()}</span>
                  <span className="text-sm text-muted">
                    {formatDate(r.receivedOn, { year: true })}
                    {r.chequeBank ? ` · ${r.chequeBank}` : ""}{r.chequeDate ? ` · dated ${formatDate(r.chequeDate, { year: true })}` : ""}{r.reference ? ` · ${r.reference}` : ""}
                  </span>
                </span>
                {r.voided ? <Badge tone="neutral">Removed</Badge> : (
                  <details className="relative">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-late underline [&::-webkit-details-marker]:hidden">Remove</summary>
                    <form action={voidPayment.bind(null, inv.id, r.id)} className="mt-2 flex flex-col gap-2 rounded-2xl bg-late-bg p-3 text-sm">
                      <span>Remove this payment? It&apos;s taken back out of your books.</span>
                      <Button variant="dark" className="self-start">Remove payment</Button>
                    </form>
                  </details>
                )}
              </li>
            ))}
          </ul>
          {paidReceipts.length > 0 && <p className="text-sm text-ink2">{fmt2(inv.paid, cur)} received in all.</p>}
        </Panel>
      )}

      {owed && (
        <Panel id="remind" title={lk ? "Send a reminder" : "Email a reminder"} aside={inv.remindersSent ? <span className="text-sm text-muted">{inv.remindersSent} sent so far{inv.lastReminderAt ? `, last on ${when(inv.lastReminderAt)}` : ""}</span> : undefined}>
          <ReminderForm action={remind.bind(null, inv.id)} whatsapp={rules.features.whatsapp} hasEmail={hasEmail} defaultMessage={reminderDefault} />
        </Panel>
      )}

      {owed && (
        <Panel id="credit" title="Give a credit note" aside={<span className="text-sm text-muted">Own number, e.g. {b.invoicePrefix}CN-0001</span>}>
          <CreditNoteForm action={creditNote.bind(null, inv.id)} lines={inv.lines} currency={cur} open={inv.open} hasEmail={hasEmail} today={now} issueDate={inv.issueDate} />
        </Panel>
      )}

      {inv.creditNotes.length > 0 && (
        <Panel title="Credit notes">
          <ul className="flex flex-col divide-y divide-divider">
            {inv.creditNotes.map((c) => (
              <li key={c.id}><Link href={`/app/in/invoices/${c.id}`} className="flex min-h-12 items-center justify-between gap-3 hover:underline"><span className="font-semibold">{c.number} · {formatDate(c.issueDate, { year: true })}</span><span className="tabular">−{fmt2(c.total, cur)}</span></Link></li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="What's happened">
        {inv.activity.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
          <ol className="flex flex-col gap-2.5">
            {inv.activity.map((a, i) => (
              <li key={i} className="flex items-start justify-between gap-4 text-[15px]">
                <span className="flex items-start gap-2.5"><span className="mt-2 size-2 shrink-0 rounded-full bg-coming" aria-hidden />{a.message}</span>
                <span className="shrink-0 text-sm text-muted">{formatDate(a.at.slice(0, 10))}</span>
              </li>
            ))}
          </ol>
        )}
        {inv.emails.length > 0 && (
          <ul className="flex flex-col gap-1.5 border-t border-line pt-3 text-sm" aria-label="Emails">
            {inv.emails.map((m, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Icon d={ICONS.mail} size={16} />{m.subject} → {m.to}</span>
                <Badge tone={m.status === "sent" ? "pos" : m.status === "failed" ? "late" : "neutral"}>{m.status === "kept" ? "Kept in the outbox" : m.status === "sent" ? "Delivered" : m.status === "failed" ? "Couldn't send" : "Sending"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {(draft || (live && inv.paid === 0 && inv.credited === 0)) && (
        <details className="self-start">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-[15px] font-semibold text-late underline [&::-webkit-details-marker]:hidden">{draft ? "Delete this draft" : "Void this invoice"}</summary>
          {draft ? (
            <form action={deleteInvoice.bind(null, inv.id)} className="mt-2 flex max-w-[480px] flex-col gap-3 rounded-2xl bg-late-bg p-4 text-sm">
              <span>Delete the draft? Nothing was sent or counted, so nothing else changes.</span>
              <Button variant="dark" className="self-start">Delete draft</Button>
            </form>
          ) : (
            <form action={voidInvoice.bind(null, inv.id)} className="mt-2 flex max-w-[480px] flex-col gap-3 rounded-2xl bg-late-bg p-4 text-sm">
              <span>Voiding takes {name} out of Coming in and your books. The number stays used, so there&apos;s no gap. Tell {inv.customer.name} yourself.</span>
              <Field label="Why (for your records)"><Input name="reason" /></Field>
              <Button variant="dark" className="self-start">Void {name}</Button>
            </form>
          )}
        </details>
      )}

      <AlsoIn />
    </>
  );
}
