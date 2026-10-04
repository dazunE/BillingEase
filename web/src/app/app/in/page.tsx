import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { BillComposer } from "@/components/in/BillComposer";
import { NudgeForm } from "@/components/in/NudgeForm";
import { Badge, ICONS, Icon, cx, type Tone } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { daysBetween, formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { comingInOverview, listCustomers, methodLabel, nextInvoiceNumber } from "@/lib/ops-in";
import { sendDraftAction } from "../invoices/actions";

export const metadata: Metadata = { title: "Coming in" };

const initials = (s: string) =>
  s
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.max(2, Math.min(98, Math.round((part / whole) * 100)));
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function ComingInPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const { customer: preselect } = await searchParams;
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, o, customers, nextNumber] = await Promise.all([
    threeNumbers(db, business.id, "month", t),
    comingInOverview(db, business.id, t),
    listCustomers(db, business.id, { today: t }),
    nextInvoiceNumber(db, business.id),
  ]);

  const lateTotal = o.late.reduce((s, r) => s + r.openCents, 0);
  const wayTotal = o.onTheWay.reduce((s, r) => s + r.openCents, 0);
  const receivedTotal = o.received.reduce((s, r) => s + r.payment.amountCents, 0);
  const receivedFrom = new Set(o.received.map((r) => r.customer.id)).size;
  const month = formatDate(t, { month: "long" });

  return (
    <>
      <EquationStrip n={n} current="in" />

      <section aria-labelledby="in-h" className="flex flex-wrap items-end gap-x-8 gap-y-5 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5">
          <h1 id="in-h" className="flex items-center gap-2.5 text-base font-bold">
            <span className="size-2.5 rounded-full bg-coming" aria-hidden />
            Coming in this {month}
          </h1>
          <span className="font-display text-[clamp(44px,6vw,64px)] font-bold leading-none tracking-[-0.03em] tabular">{formatMoney(n.comingIn, { cents: false })}</span>
          <span className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-surface" aria-hidden>
            <span className="bg-coming" style={{ width: `${pct(n.inReceived, n.comingIn)}%` }} />
            <span className="flex-1 bg-coming-light" />
          </span>
          <span className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink2">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-[3px] bg-coming" aria-hidden />
              <strong className="text-ink">{formatMoney(n.inReceived, { cents: false })}</strong> already in your bank
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-[3px] bg-coming-light" aria-hidden />
              <strong className="text-ink">{formatMoney(n.inExpected, { cents: false })}</strong> on the way
            </span>
          </span>
        </div>
        <div className="flex min-w-0 flex-[1_1_260px] flex-col items-start gap-3">
          <p className="text-[15px] leading-normal text-ink2">
            This is everything customers pay you this month. We match payments to invoices as they land, so you only see what still needs a push.
          </p>
          <a href="#bill" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]">
            <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
            Bill someone
          </a>
        </div>
      </section>

      {o.late.length > 0 && (
        <section aria-labelledby="late-h" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="late-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
              Late <span className="font-semibold text-muted">{o.late.length}</span>
            </h2>
            <span className="text-[13px] text-muted">{formatMoney(lateTotal)} past due, not counted above</span>
          </div>
          {o.late.map(({ invoice, customer, what, openCents, daysLate }) => (
            <article key={invoice.id} className="flex flex-wrap items-center gap-x-4.5 gap-y-3.5 rounded-[20px] border border-line bg-white px-5 py-4.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-late-bg">
                <Icon d={ICONS.clock} size={22} strokeWidth={1.9} />
              </span>
              <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <h3 className="text-base font-bold">{customer.name}</h3>
                  <Badge tone="late">{plural(daysLate, "day")} late</Badge>
                </span>
                <p className="text-sm leading-[1.45] text-ink2">
                  {invoice.number} · {what ?? "Invoice"}.{" "}
                  {invoice.remindersSent > 0
                    ? `${plural(invoice.remindersSent, "reminder")} went out already${invoice.lastReminderAt ? `, the last on ${invoice.lastReminderAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}, so a personal note may help.`
                    : `It was due ${formatDate(invoice.dueDate)}. A friendly nudge usually does it.`}
                </p>
              </div>
              <span className="font-display text-xl font-bold tabular">{formatMoney(openCents)}</span>
              <NudgeForm invoiceId={invoice.id} customerId={customer.id} customerName={customer.name} hasEmail={!!customer.email} back="/app/in" />
            </article>
          ))}
        </section>
      )}

      <section aria-labelledby="way-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="way-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
            On the way <span className="font-semibold text-muted">{o.onTheWay.length}</span>
          </h2>
          <span className="text-[13px] text-muted">{formatMoney(wayTotal)} not due yet · we&apos;ll show it here if it runs late</span>
        </div>
        {o.onTheWay.length > 0 ? (
          <ul className="flex flex-col rounded-[20px] border border-line bg-white px-5 py-1">
            {o.onTheWay.map(({ invoice, customer, what, openCents, daysLeft, viewedAt }, i) => {
              const s = wayStatus(invoice, viewedAt, daysLeft, t);
              return (
                <li key={invoice.id} className={cx("relative flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5", i > 0 && "border-t border-divider")}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-[13px] font-bold" aria-hidden>
                    {initials(customer.name)}
                  </span>
                  <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                    <Link href={`/app/invoices/${invoice.id}`} className="text-[15px] font-bold after:absolute after:inset-0 hover:underline">
                      {customer.name}
                    </Link>
                    <span className="text-sm text-ink2">
                      {what ?? "Invoice"} · {invoice.number}
                    </span>
                  </span>
                  <span className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    <span className="min-w-[76px] whitespace-nowrap text-[13px] text-muted">{daysLeft === 0 ? "Due today" : `Due ${formatDate(invoice.dueDate)}`}</span>
                    <span className="min-w-[72px] text-right font-display text-base font-bold tabular">{formatMoney(openCents)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-[20px] border border-line bg-white px-5 py-4 text-[15px] text-ink2">Nothing waiting right now. Bill someone below and it shows up here.</p>
        )}
      </section>

      {o.drafts.length > 0 && (
        <section aria-labelledby="drafts-h" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="drafts-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
              Drafts <span className="font-semibold text-muted">{o.drafts.length}</span>
            </h2>
            <span className="text-[13px] text-muted">Not sent yet, so not counted</span>
          </div>
          <ul className="flex flex-col rounded-[20px] border border-line bg-white px-5 py-1">
            {o.drafts.map(({ invoice, customer, what }, i) => (
              <li key={invoice.id} className={cx("flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5", i > 0 && "border-t border-divider")}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface" aria-hidden>
                  <Icon d={ICONS.doc} size={18} />
                </span>
                <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                  <Link href={`/app/invoices/${invoice.id}`} className="text-[15px] font-bold hover:underline">
                    {customer.name}
                  </Link>
                  <span className="text-sm text-ink2">
                    {what ?? "Invoice"} · {invoice.number} · {customer.email ? `will be emailed to ${customer.email}` : "no email on file"}
                  </span>
                </span>
                <span className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
                  <span className="font-display text-base font-bold tabular">{formatMoney(invoice.totalCents)}</span>
                  <form action={sendDraftAction}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input type="hidden" name="back" value="/app/in" />
                    <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-sm font-semibold hover:bg-[#a98ffb]">
                      <Icon d={ICONS.send} size={16} />
                      Send<span className="sr-only"> {invoice.number} to {customer.name}</span>
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="rec-h" className="flex flex-col gap-3">
        <h2 id="rec-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Received this month <span className="font-semibold text-muted">{o.received.length}</span>
        </h2>
        <div className="rounded-[20px] border border-line bg-white px-5 py-1.5">
          {o.received.length === 0 ? (
            <p className="py-3 text-[15px] text-ink2">No invoice payments yet this month. They show up here as soon as they land.</p>
          ) : (
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2.5 py-2.5 [&::-webkit-details-marker]:hidden">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pos-bg text-pos" aria-hidden>
                  <Icon d={ICONS.check} size={18} strokeWidth={2.6} />
                </span>
                <span className="min-w-0 flex-[1_1_220px] text-[15px] leading-[1.45]">
                  <strong>{formatMoney(receivedTotal)}</strong> from {plural(receivedFrom, "customer")}, matched to {plural(o.received.length, "invoice")}.
                </span>
                <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink/[0.07] px-4 text-sm font-semibold">
                  <span className="group-open:hidden">Show all {o.received.length}</span>
                  <span className="hidden group-open:inline">Hide</span>
                  <Icon d={ICONS.chevronDown} size={16} className="group-open:rotate-180" />
                </span>
              </summary>
              <ul>
                {o.received.map(({ payment, invoice, customer }) => (
                  <li key={payment.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-divider py-3">
                    <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                      <span className="text-[15px] font-semibold">{customer.name}</span>
                      <Link href={`/app/invoices/${invoice.id}`} className="text-[13px] text-muted underline-offset-4 hover:underline">
                        {invoice.number} · {methodLabel(payment.method)}
                      </Link>
                    </span>
                    <span className="ml-auto text-[13px] text-muted">{relativeDay(payment.receivedOn, t)}</span>
                    <span className="min-w-[72px] text-right font-display text-[15px] font-bold tabular">{formatMoney(payment.amountCents)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>

      <BillComposer
        key={nextNumber}
        customers={customers.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        initialCustomer={preselect}
        businessName={business.name}
        nextNumber={nextNumber}
        today={t}
      />

      <nav aria-label="More detail" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2 text-sm text-ink2">
        <span>Need more detail?</span>
        <Link href="/app/invoices" className="font-semibold text-ink underline underline-offset-4">
          All invoices
        </Link>
        <Link href="/app/customers" className="font-semibold text-ink underline underline-offset-4">
          Customers
        </Link>
      </nav>
    </>
  );
}

function relativeDay(iso: string, t: string) {
  const d = daysBetween(iso, t);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return formatDate(iso);
}

function wayStatus(
  inv: { paidCents: number; issueDate: string; repeatMonthly: boolean },
  viewedAt: Date | null,
  daysLeft: number,
  t: string,
): { label: string; tone: Tone } {
  if (inv.paidCents > 0) return { label: `${formatMoney(inv.paidCents)} paid`, tone: "pos" };
  if (viewedAt) {
    const d = daysBetween(viewedAt.toISOString().slice(0, 10), t);
    return { label: `Viewed ${d <= 0 ? "today" : d === 1 ? "yesterday" : formatDate(viewedAt.toISOString().slice(0, 10))}`, tone: daysLeft <= 3 ? "due" : "info" };
  }
  if (daysLeft <= 3) return { label: daysLeft === 0 ? "Due today" : "Due soon", tone: "due" };
  if (inv.repeatMonthly) return { label: "Repeats monthly", tone: "neutral" };
  return { label: `Sent ${formatDate(inv.issueDate)}`, tone: "neutral" };
}
