import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { PayForm } from "@/components/in/PayForm";
import { TestModeBanner } from "@/components/in/TestModeBanner";
import { ICONS, Icon } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { invoiceByToken, markViewed, methodLabel } from "@/lib/ops-in";
import { paymentsProvider } from "@/lib/providers";

export const metadata: Metadata = { title: "Your invoice", robots: { index: false, follow: false } };

export default async function PayPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ receipt?: string }> }) {
  const [{ token }, { receipt }] = await Promise.all([params, searchParams]);
  const db = await getDb();
  const d = await invoiceByToken(db, token);
  if (!d) notFound();
  const { invoice, customer, business, lines } = d;

  // The owner looking at their own link doesn't count as the customer opening it.
  const user = await currentUser();
  if (user?.id !== business.ownerId) await markViewed(db, business.id, customer.name, invoice.number);

  const t = today();
  const paidNow = receipt ? d.payments.find((p) => p.id === receipt) : undefined;
  const isPaid = invoice.status === "paid";
  const overdue = !isPaid && invoice.dueDate < t;
  const long = { month: "long", day: "numeric", year: "numeric" } as const;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {paymentsProvider().name === "sandbox" && <TestModeBanner />}
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-5 px-4 pb-12 pt-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-violet">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path d="M5 19 11 5h8l-6 14z" fill="#18161F" />
            </svg>
          </span>
          <span className="font-display text-xl font-bold tracking-[-0.02em]">{business.name}</span>
        </div>

        {paidNow ? (
          <section aria-labelledby="thanks-h" className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-6">
            <span className="flex size-12 items-center justify-center rounded-full bg-pos-bg text-pos">
              <Icon d={ICONS.check} size={24} strokeWidth={2.6} />
            </span>
            <h1 id="thanks-h" className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em]">
              Thank you, payment received
            </h1>
            <p className="text-[15px] text-ink2">
              You paid {business.name} <strong className="text-ink">{formatMoney(paidNow.amountCents)}</strong> for invoice {invoice.number}. Keep this page as your receipt.
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-2xl bg-bg p-4 text-sm">
              <dt className="text-muted">Amount</dt>
              <dd className="text-right font-semibold tabular">{formatMoney(paidNow.amountCents)}</dd>
              <dt className="text-muted">Paid with</dt>
              <dd className="text-right font-semibold">{methodLabel(paidNow.method)}</dd>
              <dt className="text-muted">Date</dt>
              <dd className="text-right font-semibold">{formatDate(paidNow.receivedOn, long)}</dd>
              <dt className="text-muted">Invoice</dt>
              <dd className="text-right font-semibold">{invoice.number}</dd>
              {paidNow.providerRef && (
                <>
                  <dt className="text-muted">Reference</dt>
                  <dd className="text-right font-mono text-[13px] [overflow-wrap:anywhere]">{paidNow.providerRef}</dd>
                </>
              )}
            </dl>
          </section>
        ) : isPaid ? (
          <section aria-labelledby="paid-h" className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-6">
            <span className="flex size-12 items-center justify-center rounded-full bg-pos-bg text-pos">
              <Icon d={ICONS.check} size={24} strokeWidth={2.6} />
            </span>
            <h1 id="paid-h" className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em]">
              Paid, thank you
            </h1>
            <p className="text-[15px] text-ink2">
              Invoice {invoice.number} for {formatMoney(invoice.totalCents)} is paid in full. There&apos;s nothing more to do.
            </p>
          </section>
        ) : (
          <section aria-labelledby="due-h" className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-ink2">
                Invoice {invoice.number} for {customer.name}
              </span>
              <h1 id="due-h" className="flex flex-col">
                <span className="sr-only">Amount due: </span>
                <span className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] tabular">{formatMoney(d.openCents)}</span>
              </h1>
              <span className={overdue ? "text-sm font-semibold text-late" : "text-sm text-ink2"}>
                {overdue ? `Was due ${formatDate(invoice.dueDate, long)}` : `Due ${formatDate(invoice.dueDate, long)}`}
                {invoice.paidCents > 0 && ` · ${formatMoney(invoice.paidCents)} already paid`}
              </span>
            </div>
            {invoice.allowCard || invoice.allowBank ? (
              <PayForm token={token} amount={formatMoney(d.openCents)} allowCard={invoice.allowCard} allowBank={invoice.allowBank} />
            ) : (
              <p className="rounded-xl bg-bg px-4 py-3 text-sm text-ink2">
                {business.name} asked to be paid directly for this one. Contact them for the details.
              </p>
            )}
          </section>
        )}

        <section aria-labelledby="sum-h" className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-6">
          <h2 id="sum-h" className="font-display text-lg font-bold tracking-[-0.02em]">
            What it&apos;s for
          </h2>
          <ul className="flex flex-col border-t border-divider">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 border-b border-divider py-2.5 text-sm">
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {l.description}
                  {l.quantity > 1 && <span className="text-muted"> × {l.quantity}</span>}
                </span>
                <span className="whitespace-nowrap tabular">{formatMoney(l.amountCents)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-3 text-sm">
            <span className="font-semibold">Total</span>
            <span className="font-display font-bold tabular">{formatMoney(invoice.totalCents)}</span>
          </div>
          <span className="text-[13px] text-muted">Issued {formatDate(invoice.issueDate, long)}</span>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <a href={`/i/${token}/pdf`} download className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
              <Icon d={ICONS.download} size={16} />
              Download PDF
            </a>
            <Link href={`/i/${token}/print`} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
              <Icon d={ICONS.doc} size={16} />
              View the full invoice
            </Link>
          </div>
        </section>

        <p className="mt-auto text-center text-xs text-muted">
          Sent by {business.name} with BillingEase
        </p>
      </main>
    </div>
  );
}
