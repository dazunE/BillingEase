import { goingOut, type MoneyOutItem } from "@billingease/contracts";
import { daysBetween, formatDate, formatMoney, monthLabel } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, byMonth, Crumbs, DueBadge, Empty, HeroCard, Legend, SplitBar, ToolCard } from "@/components/out/bits";
import { ExpensePanel } from "@/components/out/ExpensePanel";
import { QuickPay, QuickSort } from "@/components/out/quick";
import { Badge, ButtonLink, ICONS, Icon, SectionTitle, cx } from "@/components/ui";
import { load } from "@/lib/api";

export const metadata: Metadata = { title: "Going out" };

type Search = { period?: string; show?: string };

export default async function GoingOutPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const period = sp.period === "month" || sp.period === "quarter" || sp.period === "year" ? sp.period : undefined;
  const [setup, summary, money, unsorted, bills, suppliers] = await Promise.all([
    load(goingOut.setup),
    load(goingOut.summary, { query: { period } }),
    load(goingOut.moneyOut, { query: { period } }),
    load(goingOut.expenses, { query: { uncategorised: "true", limit: 20 } }),
    load(goingOut.bills, { query: { status: "open" } }),
    load(goingOut.suppliers),
  ]);
  const cur = setup.currency;
  const fmt = (m: number) => formatMoney(m, cur);
  const show = sp.show === "paid" ? "paid" : "topay";
  const link = (q: Search) => {
    const p = new URLSearchParams();
    const per = q.period ?? period;
    const sh = q.show ?? (sp.show ? show : undefined);
    if (per) p.set("period", per);
    if (sh) p.set("show", sh);
    const s = p.toString();
    return `/app/out${s ? `?${s}` : ""}`;
  };
  const urgent = bills.bills.filter((b) => b.due === "overdue" || b.due === "due_soon");
  const needs = (unsorted.expenses.length ? 1 : 0) + urgent.length;
  const items = show === "paid" ? money.paid : money.toPay;
  const periodWord = summary.period.key === "month" ? `this ${monthLabel(summary.period.from).split(" ")[0]}` : summary.period.key === "quarter" ? `this quarter (${summary.period.label})` : `this ${summary.period.label.replace(/^Tax year/, "tax year")}`;

  return (
    <>
      <Crumbs trail={[{ label: "Going out" }]} />

      <HeroCard
        label={<>Going out {periodWord}</>}
        amount={fmt(summary.total)}
        sub={<><SplitBar paid={summary.paid} toPay={summary.toPay} /><Legend paid={summary.paid} toPay={summary.toPay} currency={cur} /></>}
        aside={
          <nav aria-label="Period" className="flex flex-wrap gap-1.5 self-start rounded-full bg-surface p-1">
            {summary.periods.map((p) => (
              <Link key={p.key} href={link({ period: p.key })} aria-current={p.key === summary.period.key ? "page" : undefined}
                className={cx("flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold", p.key === summary.period.key ? "bg-white text-ink shadow-sm" : "text-ink2 hover:text-ink")}>
                {p.key === "month" ? "This month" : p.key === "quarter" ? "This quarter" : p.label.replace("Tax year", setup.country === "lk" ? "Year" : "Tax year")}
              </Link>
            ))}
          </nav>
        }
      >
        <p className="text-[15px] leading-relaxed">
          What you&apos;ve paid {periodWord}, plus bills still to pay. You record each payment yourself; nothing is paid from BillingEase.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <a href="#expense" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb]"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Record an expense</a>
          <ButtonLink href="/app/out/bills/new" variant="secondary"><Icon d={ICONS.bill} size={18} />Enter a bill</ButtonLink>
        </div>
      </HeroCard>

      <ExpensePanel setup={setup} suppliers={suppliers.suppliers.map((s) => s.name)} />

      <section className="flex flex-col gap-4" aria-labelledby="tools-h">
        <SectionTitle id="tools-h" aside="Bills, suppliers and every-month costs">Tools for Going out</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard href="/app/out/bills" icon={ICONS.bill} title="Bills" line="What you owe and when it's due"
            chip={summary.counts.openBills ? `${summary.counts.openBills} to pay · ${fmt(summary.counts.openBillsTotal)}` : "Nothing to pay"} chipTone={summary.needs.overdueBills ? "late" : "neutral"} />
          <ToolCard href="/app/out/suppliers" icon={ICONS.people} title="Suppliers" line="Everyone you pay, and how much"
            chip={`${summary.counts.suppliers} supplier${summary.counts.suppliers === 1 ? "" : "s"}`} />
          <ToolCard href="/app/out/monthly" icon={ICONS.clock} title="Every month" line={setup.country === "uk" ? "Desk rent, software and phone" : "Rent, electricity and internet"}
            chip={summary.counts.monthlyCosts ? (summary.counts.monthlyToPay ? `${fmt(summary.counts.monthlyToPay)} still to come` : "All recorded this month") : "None set up"} />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="needs-h">
        <SectionTitle id="needs-h" aside={needs ? `${unsorted.expenses.length} to categorise · ${urgent.length} bill${urgent.length === 1 ? "" : "s"}` : undefined}>
          Needs you {needs > 0 && <span className="text-muted">{needs}</span>}
        </SectionTitle>
        {needs === 0 && <Empty>Nothing needs you in Going out. Every expense has a category and no bill is due this week.</Empty>}
        {unsorted.expenses.length > 0 && (
          <div className="flex flex-col gap-3 rounded-[22px] border border-line bg-white p-[18px]">
            <div className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-due-bg text-due"><Icon d={ICONS.sort} size={19} /></span>
              <div className="flex flex-col">
                <span className="text-[17px] font-bold">{unsorted.expenses.length} expense{unsorted.expenses.length === 1 ? " needs" : "s need"} a category</span>
                <span className="text-sm text-ink2">Your {setup.country === "uk" ? "accountant needs them for the quarterly update" : "tax practitioner needs them for your return"}.</span>
              </div>
            </div>
            <ul className="flex flex-col divide-y divide-divider">
              {unsorted.expenses.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Link href={`/app/out/expenses/${e.id}`} className="flex min-w-0 flex-col hover:underline">
                    <span className="font-bold">{e.payee}</span>
                    <span className="text-[13px] text-muted">{formatDate(e.spentOn)} · {e.method} · <span className="tabular">{fmt(e.gross)}</span></span>
                  </Link>
                  <QuickSort id={e.id} categories={setup.categories} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {urgent.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center gap-3.5 rounded-[22px] border border-line bg-white p-[18px]">
            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-xl", b.due === "overdue" ? "bg-late-bg text-late" : "bg-going-tint")}><Icon d={ICONS.bill} size={19} /></span>
            <Link href={`/app/out/bills/${b.id}`} className="flex min-w-0 flex-[1_1_240px] flex-col hover:underline">
              <span className="text-[17px] font-bold">{b.supplierName} bill {b.due === "overdue" ? `was due ${formatDate(b.dueDate)}` : `due ${formatDate(b.dueDate)}`}</span>
              <span className="text-sm text-ink2">{b.description} · paid outside BillingEase? Mark it paid here.</span>
            </Link>
            <span className="font-display text-lg font-bold tabular">{fmt(b.left)}</span>
            <QuickPay id={b.id} left={b.left} methods={setup.payMethods} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="money-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="money-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Money out</h2>
          <nav aria-label="Show" className="flex gap-1 rounded-full bg-surface p-1">
            {[{ k: "topay", label: "Still to pay", amount: money.toPay.reduce((a, i) => a + i.amount, 0), dot: "bg-going-light" }, { k: "paid", label: "Paid", amount: summary.paid, dot: "bg-going" }].map((t) => (
              <Link key={t.k} href={link({ show: t.k })} aria-current={show === t.k ? "page" : undefined}
                className={cx("flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold", show === t.k ? "bg-white shadow-sm" : "text-ink2 hover:text-ink")}>
                <span className={cx("size-2.5 rounded-[3px]", t.dot)} aria-hidden />{t.label} <span className="tabular">{fmt(t.amount)}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="rounded-3xl border border-line bg-white p-[clamp(14px,2.5vw,22px)]">
          {items.length === 0 ? (
            <Empty>{show === "paid" ? `Nothing paid ${periodWord} yet. Record an expense or mark a bill paid and it shows here.` : "Nothing to pay: no open bills, and every every-month cost is recorded."}</Empty>
          ) : (
            byMonth(items).map((g) => (
              <div key={g.key} className="flex flex-col">
                <h3 className="flex justify-between gap-3 border-b border-line pb-2 pt-3 text-[13px] font-bold text-muted first:pt-0">
                  <span>{show === "paid" ? monthLabel(g.key + "-01") : `Due in ${monthLabel(g.key + "-01")}`}</span>
                  <span className="tabular">{fmt(g.items.reduce((a, i) => a + i.amount, 0))}</span>
                </h3>
                <ul className="flex flex-col divide-y divide-divider">
                  {g.items.map((i) => <MoneyRow key={i.kind + i.id} item={i} currency={cur} methods={setup.payMethods} today={summary.today} />)}
                </ul>
              </div>
            ))
          )}
          {show === "topay" && <p className="mt-3 text-[13px] text-muted">Pay bills the usual way{setup.country === "lk" ? ", by bank transfer or cheque" : ", by bank transfer or card"}, then mark them paid here.</p>}
        </div>
      </section>
    </>
  );
}

function MoneyRow({ item: i, currency, methods, today }: { item: MoneyOutItem; currency: "GBP" | "LKR"; methods: string[]; today: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3.5 gap-y-2 py-3">
      <Avatar name={i.name} className={i.kind === "monthly" ? "bg-tint" : undefined} />
      <Link href={i.href} className="flex min-w-0 flex-[1_1_220px] flex-col hover:underline">
        <span className="truncate font-bold">{i.name}</span>
        <span className="truncate text-[13px] text-muted">{i.kind === "expense" || i.kind === "bill_payment" ? `${formatDate(i.date)} · ` : ""}{i.detail}</span>
      </Link>
      {i.uncategorised && <Badge tone="due">To sort</Badge>}
      {i.kind === "bill" && i.due && <DueBadge bill={{ due: i.due, dueDate: i.date, daysToDue: daysBetween(today, i.date) }} />}
      {i.kind === "monthly" && <Badge tone={i.due === "late" ? "late" : "neutral"}>{i.due === "late" ? `Was due ${formatDate(i.date)}` : `Due ${formatDate(i.date)}`}</Badge>}
      <span className="ml-auto font-bold tabular">{formatMoney(i.amount, currency)}</span>
      {i.kind === "bill" && <QuickPay id={i.id} left={i.amount} methods={methods} />}
      {i.kind === "monthly" && <ButtonLink href="/app/out/monthly" variant="secondary" className="min-h-11 px-4">Record</ButtonLink>}
    </li>
  );
}
