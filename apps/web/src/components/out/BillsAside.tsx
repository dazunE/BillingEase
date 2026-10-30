import type { Bill } from "@billingease/contracts";
import { formatMoney } from "@billingease/core";
import Link from "next/link";
import { cx } from "@/components/ui";
import { Avatar, dueText } from "./bits";

const TONE: Record<string, string> = { overdue: "text-late", due_soon: "text-due", paid: "text-pos", void: "text-muted", due: "text-ink2" };

/** "Your bills": open ones first, then the last few paid. */
export function BillsAside({ bills, currentId, currency }: { bills: Bill[]; currentId?: string; currency: "GBP" | "LKR" | "USD" }) {
  const list = [...bills.filter((b) => b.status === "unpaid" || b.status === "part_paid"), ...bills.filter((b) => b.status === "paid").slice(0, 4)];
  return (
    <aside className="flex flex-col gap-3" aria-labelledby="your-bills">
      <h2 id="your-bills" className="font-display text-xl font-bold tracking-[-0.02em]">Your bills</h2>
      <div className="flex flex-col gap-1 rounded-[22px] border border-line bg-white p-1.5">
        {list.length === 0 && <p className="p-3 text-sm text-muted">No bills yet.</p>}
        {list.map((b) => (
          <Link key={b.id} href={`/app/out/bills/${b.id}`} aria-current={b.id === currentId ? "page" : undefined}
            className={cx("flex items-center gap-3 rounded-2xl p-3", b.id === currentId ? "bg-going-tint" : "hover:bg-bg")}>
            <Avatar name={b.supplierName} className={b.id === currentId ? "bg-white" : undefined} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-bold">{b.supplierName}</span>
              <span className={cx("text-xs font-bold", TONE[b.due])}>{dueText(b)}</span>
            </span>
            <span className="text-sm font-bold tabular">{formatMoney(b.status === "paid" ? b.total : b.left, currency)}</span>
          </Link>
        ))}
      </div>
      <p className="text-[13px] text-muted">
        Costs that repeat live in <Link href="/app/out/monthly" className="font-bold text-ink underline underline-offset-4">Every month</Link>. Who you pay is in <Link href="/app/out/suppliers" className="font-bold text-ink underline underline-offset-4">Suppliers</Link>.
      </p>
    </aside>
  );
}
