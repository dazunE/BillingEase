import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { Badge, ICONS, Icon, cx } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { INVOICE_FILTERS, invoiceCounts, invoiceStatus, listInvoices, type InvoiceFilter } from "@/lib/ops-in";

export const metadata: Metadata = { title: "All invoices" };

const TABS: Record<InvoiceFilter, string> = { unpaid: "Unpaid", draft: "Drafts", paid: "Paid", all: "All" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status: InvoiceFilter = (INVOICE_FILTERS as readonly string[]).includes(sp.status ?? "") ? (sp.status as InvoiceFilter) : "unpaid";
  const q = (sp.q ?? "").slice(0, 100);
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, rows, counts] = await Promise.all([threeNumbers(db, business.id, "month", t), listInvoices(db, business.id, { status, q }), invoiceCounts(db, business.id)]);
  const openTotal = rows.reduce((s, r) => s + (r.invoice.status === "sent" ? r.invoice.totalCents - r.invoice.paidCents : 0), 0);
  const href = (s: InvoiceFilter, withQuery = true) => {
    const p = new URLSearchParams();
    if (s !== "unpaid") p.set("status", s);
    if (q && withQuery) p.set("q", q);
    return `/app/invoices${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <EquationStrip n={n} current="in" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/app/in" className="text-sm font-semibold text-ink2 hover:text-ink">
            Coming in
          </Link>
          <h1 className="font-display text-[clamp(28px,3.4vw,38px)] font-bold tracking-[-0.03em]">All invoices</h1>
        </div>
        <Link href="/app/in#bill" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]">
          <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
          Bill someone
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by status" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-surface p-1">
          {INVOICE_FILTERS.map((s) => (
            <Link
              key={s}
              href={href(s)}
              aria-current={status === s ? "page" : undefined}
              className={cx("inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold", status === s ? "bg-ink text-white" : "text-ink hover:bg-white/70")}
            >
              {TABS[s]}
              <span className={cx("text-xs", status === s ? "text-tint" : "text-muted")}>{counts[s]}</span>
            </Link>
          ))}
        </nav>
        <form role="search" action="/app/invoices" className="flex min-h-11 w-full max-w-[360px] items-center gap-2 rounded-full border border-input bg-white pl-4 pr-1 focus-within:border-ink">
          {status !== "unpaid" && <input type="hidden" name="status" value={status} />}
          <Icon d={ICONS.search} size={18} className="shrink-0 text-ink2" />
          <label htmlFor="inv-q" className="sr-only">
            Search invoices
          </label>
          <input id="inv-q" name="q" type="search" defaultValue={q} placeholder="Customer, number or what it was for" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
          <button className="inline-flex min-h-9 items-center rounded-full bg-ink/[0.07] px-3.5 text-sm font-semibold hover:bg-ink/[0.11]">Search</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-[20px] border border-line bg-white p-6">
          <p className="text-[15px] text-ink2">
            {q ? (
              <>
                No {status === "all" ? "" : TABS[status].toLowerCase() + " "}invoices match &ldquo;{q}&rdquo;.
              </>
            ) : status === "unpaid" ? (
              "Nobody owes you anything right now."
            ) : status === "draft" ? (
              "No drafts. Everything you've written has gone out."
            ) : (
              "No invoices here yet."
            )}
          </p>
          {q && (
            <Link href={href(status, false)} className="text-sm font-semibold underline underline-offset-4">
              Clear the search
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">
              {TABS[status]} invoices{q ? ` matching ${q}` : ""}
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-3 pl-5 pr-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Number
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Customer
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Issued
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Due
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Amount
                </th>
                <th scope="col" className="py-3 pl-3 pr-5 text-right font-semibold">
                  Still owed
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ invoice, customer, what }) => {
                const s = invoiceStatus(invoice, t);
                const open = invoice.status === "sent" ? invoice.totalCents - invoice.paidCents : 0;
                return (
                  <tr key={invoice.id} className="relative border-b border-divider last:border-0 hover:bg-bg">
                    <td className="py-3 pl-5 pr-3">
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/app/invoices/${invoice.id}`} className="font-semibold underline-offset-4 after:absolute after:inset-0 hover:underline">
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="max-w-[260px] px-3 py-3">
                      <span className="block truncate font-semibold">{customer.name}</span>
                      {what && <span className="block truncate text-[13px] text-muted">{what}</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-ink2">{formatDate(invoice.issueDate, { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-ink2">{formatDate(invoice.dueDate, { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className={cx("whitespace-nowrap px-3 py-3 text-right tabular", invoice.status === "void" && "text-muted line-through")}>{formatMoney(invoice.totalCents)}</td>
                    <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right font-display font-bold tabular">{open > 0 ? formatMoney(open) : <span className="font-sans font-normal text-muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
            {openTotal > 0 && (
              <tfoot>
                <tr className="border-t border-line">
                  <td colSpan={6} className="py-3 pl-5 pr-3 text-right font-semibold">
                    Still owed on these
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right font-display font-bold tabular">{formatMoney(openTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </>
  );
}
