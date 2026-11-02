import { home } from "@billingease/contracts";
import { currencySymbol, rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { CashJar } from "@/components/CashJar";
import { longDate, whole } from "@/components/home/format";
import { Deadlines } from "@/components/home/Sidebar";
import { cx, Icon, ICONS } from "@/components/ui";
import { load } from "@/lib/api";
import { pendingProposals } from "@/lib/counts";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Yours to keep" };

const PERIODS = ["month", "quarter", "year"] as const;

const I = {
  bank: ICONS.bank,
  check: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  ask: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z",
  people: ICONS.people,
  cal: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4",
  percent: "M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
  chart: "M4 20V10M10 20V4M16 20v-7M2 20h20",
  flag: "M5 21V4h11l-1.5 4L16 12H5",
  folder: "M3 6h7l2 2h9v11H3z",
};

/** Yours to keep (prototype ThreeKeep): what's left after Going out and the tax set aside, and how it got there. */
export default async function KeepPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { business } = await requireBusiness();
  const { period } = await searchParams;
  const key = PERIODS.find((p) => p === period);
  const [s, toCheck] = await Promise.all([load(home.summary, { query: { period: key } }), pendingProposals()]);
  const rules = rulesFor(business.country);
  const practitioner = rules.wording.practitionerNoun;
  const lk = business.country === "lk";
  const cur = s.currency;
  const profit = s.comingIn.total - s.goingOut.total;
  const tax = s.tax.share;
  const yoursPct = profit > 0 ? Math.max(0, Math.min(100, Math.round((s.keep / profit) * 100))) : 0;
  const periodWords = s.period.key === "quarter" ? `${s.period.label.split(" ")[0]} so far` : s.period.key === "month" ? "This month so far" : "This year so far";

  const rows = [
    { sign: "+", label: "Coming in", sub: "Paid to you, or on the way", amount: s.comingIn.total, bar: "bg-coming", tint: "bg-tint" },
    { sign: "−", label: "Going out", sub: "Spending and bills, without VAT you can claim back", amount: -s.goingOut.total, bar: "bg-going", tint: "bg-going-tint" },
    { sign: "=", label: "Profit", sub: "Coming in less Going out", amount: profit, bar: "bg-ink2", tint: "bg-surface", band: true },
    { sign: "−", label: `Estimated ${s.tax.label}`, sub: `This period's share of your ${s.tax.taxYear} estimate`, amount: -tax, bar: "bg-violet", tint: "bg-tint" },
    { sign: "=", label: "Yours to keep", sub: "Pay yourself, save it or put it back in", amount: s.keep, bar: "bg-ink", tint: "bg-violet", band: true, strong: true },
  ];
  const scale = Math.max(1, ...rows.map((r) => Math.abs(r.amount)));

  const card = s.periodCard;
  const dueOf = (p: { label: string; due: string }) => `${p.label.split(" ")[0]} · due ${longDate(p.due).replace(/^\w+ /, "")}`;
  const filingStatus = card ? (card.previous ? dueOf(card.previous) : `${card.current.label.split(" ")[0]} under way`) : null;
  const tools = [
    ...(business.country === "uk" ? [{ href: "/app/keep/quarters", name: "Quarters", desc: "Making Tax Digital updates", icon: I.cal, status: card?.kind === "quarter" ? filingStatus : null }] : []),
    ...((lk && (business.vatRegistered || business.ssclRegistered)) || (business.country === "uk" && business.vatRegistered)
      ? [{ href: "/app/keep/tax-periods", name: lk ? "VAT and SSCL" : "VAT summary", desc: lk ? "Month by month, for the IRD return" : "Per VAT quarter, for your accountant", icon: I.percent, status: card?.kind === "vat-month" ? filingStatus : null }] : []),
    { href: "/app/out/payroll", name: lk ? "Payroll" : "Payroll records", desc: lk ? "EPF, ETF, APIT and payslips" : "Pay runs from your payroll software", icon: I.people, status: null },
    { href: "/app/keep/reports", name: "Reports", desc: "Profit and loss, balance sheet", icon: I.chart, status: null as string | null },
    { href: "/app/keep/year-end", name: "Tax and year-end", desc: `What your ${practitioner} needs for the year`, icon: I.flag, status: null },
    { href: "/app/statements", name: "Bank check", desc: "Upload a statement and match it", icon: I.bank, status: null },
    { href: "/app/keep/categories", name: "Categories", desc: lk ? "Lines of the income tax return" : business.country === "us" ? "Schedule C lines" : "HMRC's self-employment boxes", icon: I.folder, status: null },
    { href: "/app/check", name: "For you to check", desc: "What the AI read for you", icon: I.check, status: toCheck ? `${toCheck} waiting` : null },
  ];

  return (
    <>
      <AppCrumbs area="keep" trail={[{ label: "Yours to keep" }]} />

      <section className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Period" className="flex flex-wrap gap-1 rounded-[22px] bg-surface p-1">
          {s.periods.map((p) => (
            <Link key={p.key} href={`/app/keep?period=${p.key}`} aria-current={p.key === s.period.key ? "page" : undefined} scroll={false}
              className={cx("flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", p.key === s.period.key ? "bg-ink text-white" : "text-ink hover:bg-white/60")}>
              {p.label}
            </Link>
          ))}
        </nav>
        <span className="text-[13px] text-muted">Coming in {whole(s.comingIn.total, cur)} − Going out {whole(s.goingOut.total, cur)} = profit {whole(profit, cur)}</span>
      </section>

      <section aria-labelledby="keep-h" className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[28px] bg-ink p-[clamp(22px,4vw,40px)] text-white">
        <div className="flex min-w-0 max-w-[620px] flex-col gap-4">
          <span id="keep-h" className="flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-violet" />Yours to keep · {periodWords}</span>
          <span className="font-display text-[clamp(48px,8vw,84px)] font-bold leading-none tracking-[-0.04em] text-violet tabular-nums">{whole(s.keep, cur)}</span>
          <p className="text-[15.5px] leading-relaxed text-white/85">
            {profit > 0
              ? <>That&apos;s profit of {whole(profit, cur)} less {whole(tax, cur)} for {s.tax.label.toLowerCase()}, from your {s.tax.taxYear} estimate. Pay yourself, save it or put it back into {business.name}.</>
              : profit < 0
              ? <>Going out is ahead of Coming in by {whole(-profit, cur)} so far, so there&apos;s no tax to set aside for this period.</>
              : <>Nothing in or out yet for this period. Send an invoice or record a cost and it shows here.</>}
          </p>
          {profit > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex h-2.5 w-full max-w-[420px] overflow-hidden rounded-full bg-white/15" aria-hidden>
                <span className="h-full bg-violet" style={{ width: `${yoursPct}%` }} />
              </div>
              <div className="flex max-w-[420px] justify-between text-[12.5px] text-white/80">
                <span><strong className="text-white">{yoursPct}%</strong> of profit is yours</span>
                <span><strong className="text-white">{100 - yoursPct}%</strong> for {s.tax.label}</span>
              </div>
            </div>
          )}
          {!s.tax.verified && <span className="self-start rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">Estimate · your {practitioner} confirms the final figure</span>}
        </div>
        <CashJar size={190} amount={whole(Math.max(0, s.keep), cur)} line="#EEE8FF" taxPct={`${100 - yoursPct || 25}%`} sym={currencySymbol(cur)} className="max-md:hidden" />
      </section>

      <section aria-labelledby="books-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="books-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Your books</h2>
          <span className="text-[13px] text-muted">The checks your {practitioner} asks for</span>
        </div>
        <nav aria-label="Your books" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {tools.map((t) => (
            <Link key={t.href} href={t.href} className="flex min-w-0 flex-col gap-2.5 rounded-[20px] border border-line bg-white px-[18px] py-4 transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-input hover:shadow-[0_6px_18px_rgba(24,22,31,0.07)]">
              <span className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-ink text-violet"><Icon d={t.icon} size={20} strokeWidth={1.9} /></span>
                <Icon d={ICONS.arrowRight} size={18} className="text-[#8A8594]" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-bold leading-tight">{t.name}</span>
                <span className="text-[13px] leading-snug text-muted max-sm:hidden">{t.desc}</span>
              </span>
              {t.status && <span className="mt-auto self-start rounded-[10px] bg-due-bg px-2.5 py-0.5 text-xs font-semibold text-due">{t.status}</span>}
            </Link>
          ))}
        </nav>
      </section>

      <section aria-labelledby="how-h" className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="how-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">How we got there</h2>
          <span className="text-[13px] text-muted">{s.period.label}, to {longDate(s.period.soFar)}</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={r.label} className={cx("grid items-center gap-x-4 gap-y-2 rounded-2xl px-3 py-3 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)_120px]", r.band && (r.strong ? "bg-tint" : "bg-bg"))}>
              <span className="flex items-center gap-3">
                <span aria-hidden className={cx("flex size-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold", r.tint)}>{r.sign}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] font-semibold">{r.label}</span>
                  <span className="text-xs text-muted">{r.sub}</span>
                </span>
              </span>
              <span aria-hidden className="h-6 overflow-hidden rounded-lg bg-bg max-sm:hidden">
                <span className={cx("block h-full rounded-lg", r.bar)} style={{ width: `${Math.round((Math.abs(r.amount) / scale) * 100)}%` }} />
              </span>
              <span className={cx("text-right font-display text-lg font-bold tabular-nums max-sm:text-left", r.strong && "text-xl")}>{r.amount < 0 ? "−" : ""}{whole(Math.abs(r.amount), cur)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="est-h" className="flex min-w-0 flex-[2_1_420px] flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
          <div className="flex flex-col gap-2">
            <h2 id="est-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Your {s.tax.taxYear} estimate</h2>
            <span className="self-start rounded-full bg-due-bg px-2.5 py-0.5 text-xs font-semibold text-due">{s.tax.wording}</span>
          </div>
          <dl className="flex flex-col">
            <div className="flex items-start justify-between gap-4 border-t border-divider py-3">
              <dt className="flex flex-col"><span className="font-semibold">Profit so far</span><span className="text-xs text-muted">This {lk ? "year of assessment" : "tax year"}, to {longDate(s.period.soFar)}</span></dt>
              <dd className="font-semibold tabular-nums">{whole(s.tax.yearToDateProfit, cur)}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-divider py-3">
              <dt className="flex flex-col"><span className="font-semibold">At this pace, for the whole year</span><span className="text-xs text-muted">What the estimate is worked out on</span></dt>
              <dd className="font-semibold tabular-nums">{whole(s.tax.projectedProfit, cur)}</dd>
            </div>
            {s.tax.lines.map((l) => (
              <div key={l.label} className="flex items-start justify-between gap-4 border-t border-divider py-3">
                <dt className="flex flex-col"><span className="font-semibold">{l.label}</span>{l.note && <span className="text-xs text-muted">{l.note}</span>}</dt>
                <dd className="font-semibold tabular-nums">{whole(l.amount, cur)}</dd>
              </div>
            ))}
            <div className="mt-1 flex items-start justify-between gap-4 rounded-2xl bg-tint px-3 py-3">
              <dt className="flex flex-col"><span className="font-bold">Estimated {s.tax.label} for {s.tax.taxYear}</span><span className="text-xs text-muted">This period&apos;s share: {whole(tax, cur)}</span></dt>
              <dd className="font-display text-lg font-bold tabular-nums">{whole(s.tax.yearEstimate, cur)}</dd>
            </div>
          </dl>
        </section>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Deadlines items={s.deadlines} />
          <Link href="/app/ask" className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-5 hover:border-input">
            <span className="font-display text-lg font-bold tracking-[-0.01em]">Not sure about a number?</span>
            <span className="text-sm text-ink2">Ask about {lk ? "VAT, SSCL, APIT or income tax" : "your tax and your books"}. Answers come with their sources.</span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">Ask <Icon d={ICONS.arrowRight} size={16} /></span>
          </Link>
        </div>
      </div>
    </>
  );
}
