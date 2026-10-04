import type { Metadata } from "next";
import Link from "next/link";
import { TaskCard } from "@/components/TaskCard";
import { Card, ICONS, Icon, cx } from "@/components/ui";
import { recentActivity } from "@/lib/activity";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers, type Period } from "@/lib/numbers";
import { needsYou } from "@/lib/tasks";

export const metadata: Metadata = { title: "Home" };

const PERIODS: { key: Period; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
];

function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.max(2, Math.min(98, Math.round((part / whole) * 100)));
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: p } = await searchParams;
  const period: Period = p === "quarter" || p === "year" ? p : "month";
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, tasks, log] = await Promise.all([threeNumbers(db, business.id, period, t), needsYou(db, business.id, t), recentActivity(db, business.id, 8)]);

  const monthName = formatDate(t, { month: "long" });
  const sentence =
    n.yoursToKeep >= 0
      ? period === "month"
        ? ["You're on track to keep", `this ${monthName}.`]
        : period === "quarter"
          ? ["You're on track to keep", "this quarter."]
          : ["So far this year you're on track to keep", "after tax."]
      : ["This period is running", "short. Here's why."];

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[760px] flex-col gap-2">
          <span className="text-sm font-semibold text-muted">
            {formatDate(t, { weekday: "long", month: "long", day: "numeric" })} · {business.name}
          </span>
          <h1 className="font-display text-[clamp(30px,4vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">
            {sentence[0]}{" "}
            <span className="rounded-xl bg-tint px-2.5 [box-decoration-break:clone]">{formatMoney(Math.abs(n.yoursToKeep), { cents: false })}</span> {sentence[1]}
          </h1>
        </div>
        <nav aria-label="Period" className="flex gap-1 rounded-full bg-surface p-1">
          {PERIODS.map((x) => (
            <Link
              key={x.key}
              href={x.key === "month" ? "/app" : `/app?period=${x.key}`}
              aria-current={period === x.key ? "page" : undefined}
              className={cx("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", period === x.key ? "bg-ink text-white" : "text-ink")}
            >
              {x.label}
            </Link>
          ))}
        </nav>
      </section>

      <section aria-label="Your three numbers" className="flex flex-col items-stretch gap-3 min-[900px]:flex-row">
        <Link href="/app/in" className="flex flex-1 flex-col gap-3.5 rounded-3xl border border-line bg-white p-6 hover:border-ink/40">
          <span className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-coming" aria-hidden />
              Coming in
            </span>
            <Icon d={ICONS.arrowRight} />
          </span>
          <span className="font-display text-[clamp(34px,4vw,46px)] font-bold tracking-[-0.03em] tabular">{formatMoney(n.comingIn, { cents: false })}</span>
          <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface" aria-hidden>
            <span className="bg-coming" style={{ width: `${pct(n.inReceived, n.comingIn)}%` }} />
            <span className="flex-1 bg-coming-light" />
          </span>
          <span className="flex flex-wrap justify-between gap-x-3 text-[13px] text-ink2">
            <span>
              <strong className="text-ink">{formatMoney(n.inReceived, { cents: false })}</strong> received
            </span>
            <span>
              <strong className="text-ink">{formatMoney(n.inExpected, { cents: false })}</strong> on the way
            </span>
          </span>
        </Link>
        <div aria-hidden className="flex items-center justify-center font-display text-[30px] font-bold text-muted">
          −
        </div>
        <Link href="/app/out" className="flex flex-1 flex-col gap-3.5 rounded-3xl border border-line bg-white p-6 hover:border-ink/40">
          <span className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-going" aria-hidden />
              Going out
            </span>
            <Icon d={ICONS.arrowRight} />
          </span>
          <span className="font-display text-[clamp(34px,4vw,46px)] font-bold tracking-[-0.03em] tabular">{formatMoney(n.goingOut, { cents: false })}</span>
          <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface" aria-hidden>
            <span className="bg-going" style={{ width: `${pct(n.outPaid, n.goingOut)}%` }} />
            <span className="flex-1 bg-going-light" />
          </span>
          <span className="flex flex-wrap justify-between gap-x-3 text-[13px] text-ink2">
            <span>
              <strong className="text-ink">{formatMoney(n.outPaid, { cents: false })}</strong> paid
            </span>
            <span>
              <strong className="text-ink">{formatMoney(n.outScheduled, { cents: false })}</strong> still to pay
            </span>
          </span>
        </Link>
        <div aria-hidden className="flex items-center justify-center font-display text-[30px] font-bold text-muted">
          =
        </div>
        <Link href="/app/keep" className="flex flex-1 flex-col gap-3.5 rounded-3xl bg-ink p-6 text-white hover:bg-black">
          <span className="flex items-center justify-between font-bold text-tint">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-violet" aria-hidden />
              Yours to keep
            </span>
            <Icon d={ICONS.arrowRight} />
          </span>
          <span className="font-display text-[clamp(34px,4vw,46px)] font-bold tracking-[-0.03em] text-violet tabular">{formatMoney(n.yoursToKeep, { cents: false })}</span>
          <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/15" aria-hidden>
            <span className="bg-violet" style={{ width: `${pct(n.yoursToKeep, n.profit)}%` }} />
            <span className="flex-1 bg-tint/45" />
          </span>
          <span className="text-[13px] text-tint">
            after <strong className="text-white">{formatMoney(n.taxSetAside, { cents: false })}</strong> set aside for tax ({n.taxRateBps / 100}%)
          </span>
        </Link>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="needs-h" className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="needs-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">
              Needs you <span className="text-muted">{tasks.length}</span>
            </h2>
            <span className="text-[13px] text-muted">Only things we can&apos;t do without you</span>
          </div>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col gap-1.5 rounded-[20px] bg-ink p-6 text-white">
              <span className="font-display text-[22px] font-bold text-violet">All clear.</span>
              <span className="text-[15px] text-tint">Nothing needs you today. Your books are up to date.</span>
            </div>
          )}
        </section>

        <Card className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-[20px] p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-bold tracking-[-0.02em]">Handled for you</h2>
            <span className="text-[13px] text-muted">Latest</span>
          </div>
          <ul className="flex flex-col gap-3">
            {log.map((a) => (
              <li key={a.id} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <span className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-tint">
                  <Icon d={ICONS.check} size={13} strokeWidth={3} />
                </span>
                <span className="flex flex-col">
                  <span>{a.message}</span>
                  <span className="text-xs text-muted">{a.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </span>
              </li>
            ))}
            {log.length === 0 && <li className="text-sm text-muted">As BillingEase does things for you, they show up here.</li>}
          </ul>
        </Card>
      </div>

      <nav aria-label="Full books" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2 text-sm text-ink2">
        <span>Need the full books?</span>
        <Link href="/app/reports/profit-and-loss" className="font-semibold text-ink underline underline-offset-4">
          Profit &amp; Loss
        </Link>
        <Link href="/app/customers" className="font-semibold text-ink underline underline-offset-4">
          Customers
        </Link>
        <Link href="/app/ledger" className="font-semibold text-ink underline underline-offset-4">
          Ledger
        </Link>
        {n.lateCount > 0 && (
          <span className="ml-auto text-[13px] text-muted">
            Not counted above: {formatMoney(n.late)} late from earlier ({n.lateCount} invoice{n.lateCount === 1 ? "" : "s"})
          </span>
        )}
      </nav>
    </>
  );
}
