import { payBillOutAction } from "@/app/app/out/actions";
import { Badge, cx } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { BillRow } from "@/lib/ops-out";
import { dueBadge, initials } from "./format";

/** Bills as rows with a due badge and a Pay button (unpaid) or the date paid. */
export function BillList({ bills, today, back, payFromName }: { bills: BillRow[]; today: string; back: string; payFromName: string }) {
  return (
    <ul className="flex flex-col">
      {bills.map((b, i) => {
        const due = dueBadge(b.dueDate, today);
        const soon = b.status === "unpaid" && due.tone !== "neutral";
        return (
          <li key={b.id} className={cx("flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-3.5 sm:px-5", i > 0 && "border-t border-divider")}>
            <span
              aria-hidden
              className={cx(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                soon ? (due.tone === "late" ? "bg-late-bg text-late" : "bg-due-bg text-due") : "bg-going-tint text-ink",
              )}
            >
              {initials(b.vendorName)}
            </span>
            <div className="flex min-w-0 flex-[1_1_180px] flex-col">
              <span className="truncate text-[15px] font-bold">{b.vendorName}</span>
              <span className="truncate text-[13px] text-ink2">
                {b.description} · {b.categoryName}
              </span>
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
              {b.status === "unpaid" ? <Badge tone={due.tone}>{due.label}</Badge> : <Badge tone="pos">Paid {b.paidOn ? formatDate(b.paidOn) : ""}</Badge>}
              <span className="min-w-[72px] text-right font-display text-[15px] font-bold tabular">{formatMoney(b.amountCents)}</span>
              {b.status === "unpaid" && (
                <form action={payBillOutAction}>
                  <input type="hidden" name="billId" value={b.id} />
                  <input type="hidden" name="back" value={back} />
                  <button
                    className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold text-ink hover:bg-ink/[0.11]"
                    aria-label={`Pay ${b.vendorName} ${formatMoney(b.amountCents)} from ${payFromName} today`}
                    title={`Pays from ${payFromName} today`}
                  >
                    Pay
                  </button>
                </form>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
