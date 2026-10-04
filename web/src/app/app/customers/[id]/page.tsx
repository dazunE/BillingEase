import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EquationStrip } from "@/components/EquationStrip";
import { CustomerForm } from "@/components/in/CustomerForm";
import { Badge, ICONS, Icon } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { getCustomer, invoiceStatus, listInvoices } from "@/lib/ops-in";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, customer, invs] = await Promise.all([
    threeNumbers(db, business.id, "month", t),
    getCustomer(db, business.id, id),
    listInvoices(db, business.id, { status: "all", customerId: id }),
  ]);
  if (!customer) notFound();
  const open = invs.filter((r) => r.invoice.status === "sent");
  const openCents = open.reduce((s, r) => s + r.invoice.totalCents - r.invoice.paidCents, 0);
  const lateCents = open.filter((r) => r.invoice.dueDate < t).reduce((s, r) => s + r.invoice.totalCents - r.invoice.paidCents, 0);
  const paidCents = invs.reduce((s, r) => s + (r.invoice.status === "void" ? 0 : r.invoice.paidCents), 0);

  return (
    <>
      <EquationStrip n={n} current="in" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Link href="/app/customers" className="text-sm font-semibold text-ink2 hover:text-ink">
            Customers
          </Link>
          <h1 className="font-display text-[clamp(28px,3.4vw,38px)] font-bold tracking-[-0.03em] [overflow-wrap:anywhere]">{customer.name}</h1>
        </div>
        <Link href={`/app/in?customer=${customer.id}#bill`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]">
          <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
          Bill them
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[700px]:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-white p-5">
          <span className="text-[13px] font-semibold text-muted">Owes you</span>
          <span className="font-display text-[28px] font-bold tracking-[-0.03em] tabular">{formatMoney(openCents)}</span>
          <span className="text-[13px] text-ink2">
            {open.length} open invoice{open.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-white p-5">
          <span className="text-[13px] font-semibold text-muted">Late</span>
          <span className="font-display text-[28px] font-bold tracking-[-0.03em] tabular">{formatMoney(lateCents)}</span>
          <span className="text-[13px] text-ink2">{lateCents > 0 ? "Past the due date" : "Nothing late"}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-white p-5">
          <span className="text-[13px] font-semibold text-muted">Paid you so far</span>
          <span className="font-display text-[28px] font-bold tracking-[-0.03em] tabular">{formatMoney(paidCents)}</span>
          <span className="text-[13px] text-ink2">Across all invoices</span>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="inv-h" className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
          <h2 id="inv-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
            Invoices <span className="font-semibold text-muted">{invs.length}</span>
          </h2>
          {invs.length === 0 ? (
            <p className="rounded-[20px] border border-line bg-white p-5 text-[15px] text-ink2">No invoices yet. Use Bill them to send the first one.</p>
          ) : (
            <ul className="flex flex-col rounded-[20px] border border-line bg-white px-5 py-1">
              {invs.map(({ invoice, what }, i) => {
                const s = invoiceStatus(invoice, t);
                const owed = invoice.status === "sent" ? invoice.totalCents - invoice.paidCents : 0;
                return (
                  <li key={invoice.id} className={`relative flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3.5 ${i > 0 ? "border-t border-divider" : ""}`}>
                    <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                      <Link href={`/app/invoices/${invoice.id}`} className="text-[15px] font-semibold after:absolute after:inset-0 hover:underline">
                        {invoice.number}
                      </Link>
                      <span className="truncate text-[13px] text-muted">
                        {what ?? "Invoice"} · issued {formatDate(invoice.issueDate)}
                      </span>
                    </span>
                    <span className="ml-auto flex items-center gap-4">
                      <Badge tone={s.tone}>{s.label}</Badge>
                      <span className="min-w-[80px] text-right font-display font-bold tabular">{formatMoney(owed > 0 ? owed : invoice.totalCents)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section id="edit" aria-labelledby="edit-h" className="flex min-w-0 flex-[1_1_340px] scroll-mt-4 flex-col gap-4 rounded-[20px] border border-line bg-white p-5">
          <div className="flex flex-col gap-1">
            <h2 id="edit-h" className="font-display text-lg font-bold tracking-[-0.02em]">
              Contact details
            </h2>
            {!customer.email && <p className="text-sm font-semibold text-due">No email yet, so invoices and reminders can&apos;t be emailed to them.</p>}
          </div>
          <CustomerForm customerId={customer.id} initial={customer} submitLabel="Save changes" />
        </section>
      </div>
    </>
  );
}
