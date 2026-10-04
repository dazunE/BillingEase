import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EquationStrip } from "@/components/EquationStrip";
import { CopyButton } from "@/components/in/CopyButton";
import { InvoiceDocument } from "@/components/in/InvoiceDocument";
import { NudgeForm } from "@/components/in/NudgeForm";
import { Badge, ICONS, Icon, inputClass, cx } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { invoiceDetail, invoiceStatus } from "@/lib/ops-in";
import { baseUrl } from "../../in/run";
import { recordPaymentAction, sendDraftAction, voidAction } from "../actions";

export const metadata: Metadata = { title: "Invoice" };

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-violet px-5 text-sm font-semibold text-ink hover:bg-[#a98ffb]";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, d, base] = await Promise.all([threeNumbers(db, business.id, "month", t), invoiceDetail(db, business.id, id), baseUrl()]);
  if (!d) notFound();
  const { invoice, customer, timeline, openCents } = d;
  const s = invoiceStatus(invoice, t);
  const payLink = `${base}/i/${invoice.publicToken}`;
  const back = `/app/invoices/${invoice.id}`;
  const payLinkCard = (
              <section aria-labelledby="link-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
                <h2 id="link-h" className="font-display text-lg font-bold tracking-[-0.02em]">
                  Pay link
                </h2>
                <p className="text-sm text-ink2">Anyone with this link can see and pay this invoice. Share it by text, chat or your own email.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input readOnly value={payLink} aria-label="Pay link" className={cx(inputClass, "min-w-0 flex-[1_1_200px] bg-bg text-sm")} />
                  <CopyButton text={payLink} />
                </div>
              </section>
  );

  return (
    <>
      <EquationStrip n={n} current="in" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink2">
            <Link href="/app/in" className="hover:text-ink">
              Coming in
            </Link>
            <span aria-hidden>/</span>
            <Link href="/app/invoices?status=all" className="hover:text-ink">
              All invoices
            </Link>
          </nav>
          <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[clamp(26px,3.4vw,36px)] font-bold tracking-[-0.03em]">
            {invoice.number}
            <Badge tone={s.tone} className="font-sans text-sm tracking-normal">
              {s.label}
            </Badge>
          </h1>
          <p className="text-[15px] text-ink2">
            <Link href={`/app/customers/${customer.id}`} className="font-semibold text-ink underline underline-offset-4">
              {customer.name}
            </Link>{" "}
            · {formatMoney(invoice.totalCents)} · due {formatDate(invoice.dueDate, { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-col items-start gap-0.5 rounded-[20px] border border-line bg-white px-5 py-3.5 min-[700px]:items-end">
          <span className="text-[13px] font-semibold text-muted">{invoice.status === "draft" ? "Will be owed once sent" : "Still owed"}</span>
          <span className="font-display text-[32px] font-bold leading-tight tracking-[-0.03em] tabular">{formatMoney(invoice.status === "sent" || invoice.status === "draft" ? openCents : 0)}</span>
          {invoice.paidCents > 0 && <span className="text-[13px] text-ink2">{formatMoney(invoice.paidCents)} paid so far</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
          <InvoiceDocument doc={d} />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href={`/app/invoices/${invoice.id}/print`} className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-4">
              <Icon d={ICONS.doc} size={16} />
              Printable version
            </Link>
            {invoice.status !== "draft" && invoice.status !== "void" && (
              <Link href={`/i/${invoice.publicToken}`} target="_blank" className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-4">
                <Icon d={ICONS.arrowRight} size={16} />
                See what your customer sees
                <span className="sr-only">(opens in a new tab)</span>
              </Link>
            )}
          </div>
        </div>

        <aside aria-label="What you can do" className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          {invoice.status === "draft" && (
            <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
              <h2 className="font-display text-lg font-bold tracking-[-0.02em]">Ready to send?</h2>
              <p className="text-sm text-ink2">
                {customer.email
                  ? `We'll email it to ${customer.email} with a link to pay online.`
                  : `${customer.name} has no email on file, so sending puts it on the books and gives you a pay link to share yourself.`}
              </p>
              <form action={sendDraftAction}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <input type="hidden" name="back" value={back} />
                <button className={cx(primary, "w-full")}>
                  <Icon d={ICONS.send} size={16} />
                  Send invoice
                </button>
              </form>
            </section>
          )}

          {invoice.status === "sent" && (
            <>
              {!customer.email && payLinkCard}
              <section aria-labelledby="pay-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
                <h2 id="pay-h" className="font-display text-lg font-bold tracking-[-0.02em]">
                  Record a payment
                </h2>
                <p className="text-sm text-ink2">Got paid by cash, check or a transfer we didn&apos;t match? Note it here.</p>
                <form action={recordPaymentAction} className="flex flex-col gap-3">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <input type="hidden" name="back" value={back} />
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold">Amount</span>
                    <span className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-ink2" aria-hidden>
                        $
                      </span>
                      <input name="amount" inputMode="decimal" required defaultValue={(openCents / 100).toFixed(2)} className={cx(inputClass, "pl-7 tabular")} />
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex min-w-[130px] flex-1 flex-col gap-1.5">
                      <span className="text-[13px] font-semibold">How they paid</span>
                      <select name="method" defaultValue="bank" className={cx(inputClass, "pr-8")}>
                        <option value="bank">Bank transfer</option>
                        <option value="check">Check</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                      </select>
                    </label>
                    <label className="flex min-w-[150px] flex-1 flex-col gap-1.5">
                      <span className="text-[13px] font-semibold">Date received</span>
                      <input name="receivedOn" type="date" required defaultValue={t} max={t} className={inputClass} />
                    </label>
                  </div>
                  <button className={primary}>
                    <Icon d={ICONS.check} size={16} strokeWidth={2.4} />
                    Record payment
                  </button>
                </form>
              </section>

              <section aria-labelledby="remind-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
                <h2 id="remind-h" className="font-display text-lg font-bold tracking-[-0.02em]">
                  Send a reminder
                </h2>
                <p className="text-sm text-ink2">
                  {customer.email ? `Emails ${customer.email} the pay link with a friendly note.` : `${customer.name} has no email on file yet.`}
                  {invoice.remindersSent > 0 && ` ${invoice.remindersSent} sent so far.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <NudgeForm invoiceId={invoice.id} customerId={customer.id} customerName={customer.name} hasEmail={!!customer.email} back={back} showSee={false} />
                </div>
              </section>

              {customer.email && payLinkCard}
            </>
          )}

          {(invoice.status === "sent" || invoice.status === "draft") && invoice.paidCents === 0 && (
            <details className="group rounded-[20px] border border-line bg-white p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {invoice.status === "draft" ? "Discard this draft" : "Void this invoice"}
                <Icon d={ICONS.chevronDown} size={16} className="group-open:rotate-180" />
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <p className="text-sm text-ink2">
                  {invoice.status === "draft"
                    ? "It hasn't been sent, so nothing changes in your books. This can't be undone."
                    : `${customer.name} won't owe this anymore, the pay link stops working, and the sale comes off your books. This can't be undone.`}
                </p>
                <form action={voidAction}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <button className="inline-flex min-h-11 items-center rounded-full bg-late px-5 text-sm font-semibold text-white hover:bg-[#8c1a0a]">
                    {invoice.status === "draft" ? "Yes, discard it" : `Yes, void ${invoice.number}`}
                  </button>
                </form>
              </div>
            </details>
          )}

          {invoice.status === "paid" && (
            <p className="flex items-center gap-3 rounded-[20px] bg-pos-bg p-5 text-sm font-semibold text-pos">
              <Icon d={ICONS.check} size={20} strokeWidth={2.6} />
              Paid in full. Nothing to do here.
            </p>
          )}

          <section aria-labelledby="tl-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
            <h2 id="tl-h" className="font-display text-lg font-bold tracking-[-0.02em]">
              What happened
            </h2>
            <ol className="flex flex-col">
              {timeline.map((e, i) => (
                <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < timeline.length - 1 && <span className="absolute left-[10px] top-6 h-[calc(100%-20px)] w-px bg-line" aria-hidden />}
                  <span className="mt-0.5 flex size-[21px] shrink-0 items-center justify-center rounded-full bg-tint">
                    <span className="size-2 rounded-full bg-coming" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">{e.label}</span>
                    {e.detail && <span className="text-[13px] text-ink2 [overflow-wrap:anywhere]">{e.detail}</span>}
                    <span className="text-xs text-muted">{e.at.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
