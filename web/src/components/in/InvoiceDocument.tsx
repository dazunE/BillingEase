import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

type Doc = {
  business: { name: string };
  customer: { name: string; email: string | null; phone: string | null; address: string | null };
  invoice: { number: string; issueDate: string; dueDate: string; memo: string | null; totalCents: number; paidCents: number; status: string };
  lines: { id: string; description: string; quantity: number; unitCents: number; amountCents: number }[];
};

/** The invoice itself, as the customer sees it (also used for printing). */
export function InvoiceDocument({ doc, className = "" }: { doc: Doc; className?: string }) {
  const { business, customer, invoice, lines } = doc;
  const open = invoice.status === "void" ? 0 : invoice.totalCents - invoice.paidCents;
  const long = { month: "long", day: "numeric", year: "numeric" } as const;
  return (
    <article aria-label={`Invoice ${invoice.number}`} className={`flex flex-col gap-7 rounded-3xl border border-line bg-white p-[clamp(20px,4vw,44px)] ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <span className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-violet print:border print:border-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path d="M5 19 11 5h8l-6 14z" fill="#18161F" />
            </svg>
          </span>
          <span className="font-display text-xl font-bold tracking-[-0.02em]">{business.name}</span>
        </span>
        <span className="text-right">
          <span className="block font-display text-2xl font-bold tracking-[-0.02em]">Invoice</span>
          <span className="text-sm text-ink2">{invoice.number}</span>
        </span>
      </header>

      <div className="flex flex-wrap justify-between gap-6 text-sm">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Bill to</span>
          <span className="text-base font-bold">{customer.name}</span>
          {customer.address && <span className="whitespace-pre-line text-ink2">{customer.address}</span>}
          {customer.email && <span className="text-ink2">{customer.email}</span>}
          {customer.phone && <span className="text-ink2">{customer.phone}</span>}
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1">
          <dt className="text-muted">Issued</dt>
          <dd className="text-right font-semibold">{formatDate(invoice.issueDate, long)}</dd>
          <dt className="text-muted">Due</dt>
          <dd className="text-right font-semibold">{formatDate(invoice.dueDate, long)}</dd>
        </dl>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Description
              </th>
              <th scope="col" className="w-14 py-2 pr-3 text-right font-semibold">
                Qty
              </th>
              <th scope="col" className="w-28 py-2 pr-3 text-right font-semibold">
                Price
              </th>
              <th scope="col" className="w-28 py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-divider align-top">
                <td className="py-3 pr-3 [overflow-wrap:anywhere]">{l.description}</td>
                <td className="py-3 pr-3 text-right tabular">{l.quantity}</td>
                <td className="py-3 pr-3 text-right tabular">{formatMoney(l.unitCents)}</td>
                <td className="py-3 text-right tabular">{formatMoney(l.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto grid w-full max-w-[320px] grid-cols-[1fr_auto] gap-y-2 text-sm [&>dd]:pl-6">
        <dt className="text-ink2">Total</dt>
        <dd className="text-right font-semibold tabular">{formatMoney(invoice.totalCents)}</dd>
        {invoice.paidCents > 0 && (
          <>
            <dt className="text-ink2">Paid</dt>
            <dd className="text-right font-semibold tabular">−{formatMoney(invoice.paidCents)}</dd>
          </>
        )}
        <dt className="border-t border-ink pt-2 text-base font-bold">{invoice.status === "paid" || invoice.status === "void" ? "Balance" : "Amount due"}</dt>
        <dd className="border-t border-ink pt-2 text-right font-display text-xl font-bold tabular">{formatMoney(open)}</dd>
      </dl>

      {invoice.memo && <p className="whitespace-pre-line text-sm text-ink2">{invoice.memo}</p>}
      {invoice.status === "void" && <p className="rounded-xl bg-surface px-4 py-3 text-sm font-semibold">This invoice was voided. Nothing is owed on it.</p>}
      {invoice.status === "paid" && <p className="rounded-xl bg-pos-bg px-4 py-3 text-sm font-semibold text-pos">Paid in full. Thank you!</p>}
    </article>
  );
}
