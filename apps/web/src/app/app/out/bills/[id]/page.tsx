import { goingOut } from "@billingease/contracts";
import { formatDate, formatMoney } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { voidBill } from "@/app/app/out/actions";
import { BillsAside } from "@/components/out/BillsAside";
import { DueBadge, Legend, SplitBar } from "@/components/out/bits";
import { PayBillForm } from "@/components/out/PayBillForm";
import { ActionButton, AttachmentList } from "@/components/out/quick";
import { ApiFailure, load } from "@/lib/api";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Bill" };

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await load(goingOut.bill, { params: { id } }).catch((err) => {
    if (err instanceof ApiFailure && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  });
  const [setup, bills] = await Promise.all([load(goingOut.setup), load(goingOut.bills)]);
  const b = d.bill;
  const money = (m: number) => formatMoney(m, setup.currency, { decimals: "always" });
  const open = b.status === "unpaid" || b.status === "part_paid";
  const uk = setup.country === "uk";

  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Bills", href: "/app/out/bills" }, { label: b.supplierName }]} />
      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        <div className="order-last lg:order-none"><BillsAside bills={bills.bills} currentId={b.id} currency={setup.currency} /></div>
        <article className="flex flex-col gap-6 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <DueBadge bill={b} className="self-start" />
              <h1 className="font-display text-[clamp(26px,3.5vw,34px)] font-bold leading-tight tracking-[-0.03em]">
                <Link href={`/app/out/suppliers/${b.supplierId}`} className="hover:underline">{b.supplierName}</Link>
              </h1>
              <span className="text-[15px] text-ink2">Bill{b.reference ? ` ${b.reference}` : ""} · dated {formatDate(b.billDate)} · due {formatDate(b.dueDate)}</span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="font-display text-[clamp(28px,3.5vw,36px)] font-bold tracking-[-0.03em] tabular">{money(b.total)}</span>
              <span className="text-[13px] text-ink2">{b.status === "void" ? "Voided: nothing owed" : b.status === "paid" ? "Paid in full" : `${money(b.left)} left to pay`}</span>
            </div>
          </header>

          {b.status !== "void" && (
            <div className="flex flex-col gap-2.5">
              <SplitBar paid={b.paid} toPay={b.left} />
              <Legend paid={b.paid} toPay={b.left} currency={setup.currency} toPayLabel="left to pay" />
            </div>
          )}
          {open && <PayBillForm billId={b.id} left={b.left} currency={setup.currency} methods={setup.payMethods} today={setup.today} supplier={b.supplierName} />}

          <section className="flex flex-col gap-2.5" aria-labelledby="lines-h">
            <h2 id="lines-h" className="text-base font-bold">On the bill</h2>
            <div className="flex flex-col divide-y divide-divider rounded-2xl border border-line px-4">
              {d.lines.map((l) => (
                <div key={l.id} className="flex flex-wrap items-start justify-between gap-3 py-3.5">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-bold">{l.description}</span>
                    <span className="text-[13px] text-muted">{l.categoryName} · {l.categoryOfficial}</span>
                  </span>
                  <span className="text-right font-bold tabular">{money(l.net + (setup.vatRegistered ? 0 : l.vat))}</span>
                </div>
              ))}
              {setup.vatRegistered && b.vat > 0 && (
                <div className="flex flex-wrap items-start justify-between gap-3 py-3.5">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-bold">{uk ? "VAT (inside the total)" : "Input VAT (inside the total)"}</span>
                    <span className="text-[13px] text-muted">{uk ? "You can reclaim it on your VAT return" : "From the supplier's Tax Invoice · goes to your VAT return"}</span>
                  </span>
                  <span className="text-right font-bold tabular">{money(b.vat)}</span>
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-2.5" aria-labelledby="files-h">
            <h2 id="files-h" className="text-base font-bold">The bill itself</h2>
            <AttachmentList ownerType="bill" ownerId={b.id} files={d.attachments} hint={uk ? "HMRC can ask to see it." : "For your tax practitioner."} />
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="flex flex-col gap-2.5" aria-labelledby="pay-h">
              <h2 id="pay-h" className="text-base font-bold">Payments</h2>
              {d.payments.length === 0 ? (
                <p className="rounded-2xl bg-surface px-4 py-3 text-sm text-ink2">Nothing marked paid yet. Each payment you mark shows up here and in Going out as paid.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-divider rounded-2xl bg-surface px-4">
                  {d.payments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3 py-3 text-sm">
                      <span className="flex flex-col">
                        <span className="font-semibold">{formatDate(p.paidOn)} · {p.method}</span>
                        {p.chequeNumber && <span className="text-xs text-muted">Cheque {p.chequeNumber}{p.chequeDate ? `, dated ${formatDate(p.chequeDate)}` : ""}{p.chequeBank ? `, ${p.chequeBank}` : ""}</span>}
                        {p.reference && <span className="text-xs text-muted">Ref {p.reference}</span>}
                      </span>
                      <span className="font-bold tabular">{money(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="flex flex-col gap-2.5" aria-labelledby="hist-h">
              <h2 id="hist-h" className="text-base font-bold">Bill history</h2>
              <ul className="flex flex-col divide-y divide-divider rounded-2xl bg-surface px-4">
                {d.history.map((h, i) => (
                  <li key={i} className="flex justify-between gap-3 py-3 text-sm"><span>{h.text}</span><span className="shrink-0 text-muted">{formatDate(h.date)}</span></li>
                ))}
              </ul>
            </section>
          </div>

          {b.status === "unpaid" && (
            <section className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <p className="text-sm text-ink2">Entered by mistake, or the supplier cancelled it? Voiding takes it off Going out; your books keep a reversal.</p>
              <ActionButton action={voidBill} fields={{ id: b.id }} variant="danger" confirm="Void this bill?">Void bill</ActionButton>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
