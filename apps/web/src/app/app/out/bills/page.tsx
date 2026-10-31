import { goingOut } from "@billingease/contracts";
import { formatDate, formatMoney } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, DueBadge, Empty, HeroCard } from "@/components/out/bits";
import { QuickPay } from "@/components/out/quick";
import { ButtonLink, ICONS, Icon, cx } from "@/components/ui";
import { load } from "@/lib/api";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Bills" };

const FILTERS = [
  { id: "open", label: "To pay" },
  { id: "overdue", label: "Late" },
  { id: "soon", label: "Due this week" },
  { id: "paid", label: "Paid" },
  { id: "all", label: "All" },
] as const;

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show: raw } = await searchParams;
  const show = FILTERS.find((f) => f.id === raw)?.id ?? "open";
  const query = show === "overdue" ? { due: "overdue" as const } : show === "soon" ? { due: "soon" as const } : { status: show };
  const [setup, data] = await Promise.all([load(goingOut.setup), load(goingOut.bills, { query })]);
  const fmt = (m: number) => formatMoney(m, setup.currency);
  const t = data.totals;
  const next = data.bills.find((b) => b.status === "unpaid" || b.status === "part_paid");

  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: "Bills" }]} />
      <HeroCard label="Bills to pay" amount={fmt(t.open)}
        sub={<span className="text-sm text-ink2">{t.openCount} bill{t.openCount === 1 ? "" : "s"}{t.overdueCount ? ` · ${t.overdueCount} late (${fmt(t.overdue)})` : ""}{show === "open" && next ? ` · next due ${formatDate(next.dueDate)}: ${next.supplierName} ${formatMoney(next.left, next.currency, { homeOf: setup.currency })}` : ""}</span>}>
        <p className="text-[15px] leading-relaxed">
          A bill is something you owe and pay later, outside BillingEase. Enter it once with a photo or PDF, then mark it paid in full or in part when you&apos;ve paid it{setup.country === "lk" ? " by bank transfer, cheque or cash" : " by bank, card or cash"}.
        </p>
        <ButtonLink href="/app/out/bills/new" className="self-start"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Enter a bill</ButtonLink>
      </HeroCard>

      <nav aria-label="Filter bills" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.id} href={f.id === "open" ? "/app/out/bills" : `/app/out/bills?show=${f.id}`} aria-current={f.id === show ? "page" : undefined}
            className={cx("flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold", f.id === show ? "border-going bg-going-tint" : "border-line bg-white hover:border-input")}>
            {f.label}{f.id === "overdue" && t.overdueCount ? ` ${t.overdueCount}` : f.id === "soon" && t.dueSoonCount ? ` ${t.dueSoonCount}` : f.id === "open" ? ` ${t.openCount}` : ""}
          </Link>
        ))}
      </nav>

      <section className="rounded-3xl border border-line bg-white p-[clamp(12px,2.5vw,20px)]" aria-label="Bills">
        {data.bills.length === 0 ? <Empty>{show === "open" ? "No bills to pay. Enter one when it arrives and it shows here until you mark it paid." : "No bills here."}</Empty> : (
          <ul className="flex flex-col divide-y divide-divider">
            {data.bills.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 py-3">
                <Avatar name={b.supplierName} />
                <Link href={`/app/out/bills/${b.id}`} className="flex min-w-0 flex-[1_1_220px] flex-col hover:underline">
                  <span className="truncate font-bold">{b.supplierName}{b.reference ? <span className="font-normal text-muted"> · {b.reference}</span> : null}</span>
                  <span className="truncate text-[13px] text-muted">{b.description} · dated {formatDate(b.billDate)}{b.attachmentCount ? " · attached" : ""}</span>
                </Link>
                <DueBadge bill={b} />
                <span className="ml-auto text-right font-bold tabular">
                  {formatMoney(b.status === "paid" || b.status === "void" ? b.total : b.left, b.currency, { homeOf: setup.currency })}
                  {b.status === "part_paid" && <span className="block text-xs font-normal text-muted">of {formatMoney(b.total, b.currency, { homeOf: setup.currency })}</span>}
                  {b.currency !== setup.currency && <span className="block text-xs font-normal text-muted">{fmt(b.status === "paid" || b.status === "void" ? b.homeTotal : b.homeLeft)} in your books</span>}
                </span>
                {(b.status === "unpaid" || b.status === "part_paid") && <QuickPay id={b.id} left={b.left} methods={setup.payMethods} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
