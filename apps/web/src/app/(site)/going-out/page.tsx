import type { Metadata } from "next";
import { RatesNote } from "@/components/site";
import { BillDemo, ExpenseDemo, MonthlyList, PayrollDemo, SortDemo } from "@/components/site/illustrations/product/GoingOutDemos";
import { Band, FaqBlock, Heading, ProductCta, ProductHero, QuoteRow } from "@/components/site/illustrations/product/kit";
import { money, pick } from "@/content/site/country";
import { GO_BILLS, GO_CTA, GO_EXPENSES, GO_FAQ, GO_HERO, GO_PEOPLE, GO_QUOTES, GO_SORT, GOING_OUT_META } from "@/content/site/going-out";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = { title: GOING_OUT_META.title, description: GOING_OUT_META.description };

export default async function GoingOutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const lk = country === "lk";
  const ex = GO_EXPENSES[country];

  return (
    <>
      <ProductHero
        kicker={GO_HERO.kicker}
        dot="out"
        title={pick(GO_HERO.title, country)}
        lead={pick(GO_HERO.lead, country)}
        country={country}
        second={{ label: "See pricing", href: ROUTES.pricing.href }}
        small={GO_HERO.small}
        art={<ExpenseDemo key={country} country={country} start={ex.start} cats={ex.cats} list={ex.list} />}
      />

      {/* Categories */}
      <Band labelledBy="sort-h" tone="white" className="flex flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 max-w-[460px] flex-[1_1_360px] flex-col gap-[18px]">
          <Heading id="sort-h" kicker={GO_SORT.kicker} dot="out" title={pick(GO_SORT.title, country)} lead={pick(GO_SORT.lead, country)} />
          <div className="flex flex-wrap gap-7 pt-1.5">
            <span className="flex flex-col">
              <span className="font-display text-[40px] font-bold tracking-[-0.03em] tabular-nums">1</span>
              <span className="text-[13px] leading-[1.45] text-muted">
                tap to choose
                <br />a category
              </span>
            </span>
            <span className="flex flex-col">
              <span className="font-display text-[40px] font-bold tracking-[-0.03em] tabular-nums text-[#B4501A]">0</span>
              <span className="text-[13px] leading-[1.45] text-muted">
                entries added
                <br />
                without your OK
              </span>
            </span>
          </div>
          <span className="text-[13px] leading-[1.45] text-muted">{pick(GO_SORT.small, country)}</span>
        </div>
        <SortDemo key={country} country={country} rows={GO_SORT.rows[country]} cats={GO_SORT.cats[country]} />
      </Band>

      {/* Bills + every month */}
      <Band labelledBy="bills-h" className="flex flex-col gap-9">
        <Heading id="bills-h" kicker={GO_BILLS.kicker} dot="out" title={GO_BILLS.title} lead={GO_BILLS.lead} />
        <div className="flex flex-wrap items-stretch gap-4">
          <BillDemo key={`b${country}`} country={country} b={GO_BILLS.bill[country]} />
          <MonthlyList key={`m${country}`} country={country} rows={GO_BILLS.monthly[country]} />
        </div>
      </Band>

      {/* Suppliers and payroll */}
      <Band labelledBy="people-h" tone="white" className="flex flex-col gap-9">
        <Heading id="people-h" kicker={GO_PEOPLE.kicker} dot="out" title={pick(GO_PEOPLE.title, country)} lead={pick(GO_PEOPLE.lead, country)} />
        <div className="flex flex-wrap items-stretch gap-4">
          <article className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-3xl bg-bg p-[clamp(20px,2.4vw,28px)]">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">Suppliers</h3>
              <span className="text-[13px] text-muted">{lk ? "Who you pay, with input VAT from their Tax Invoices" : "Who you pay and what you owe them"}</span>
            </div>
            {GO_PEOPLE.suppliers[country].map((v) => (
              <div key={v[1]} className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[18px] border border-line bg-white px-4 py-3.5">
                <span aria-hidden className="flex size-10 flex-none items-center justify-center rounded-full text-[13px] font-bold" style={{ background: v[5] }}>
                  {v[0]}
                </span>
                <span className="flex min-w-0 flex-[1_1_160px] flex-col">
                  <span className="font-bold">{v[1]}</span>
                  <span className="text-[13px] text-muted">
                    {v[2]} · {money(v[3], country)} paid this {lk ? "year" : "tax year"}
                  </span>
                </span>
                <span className={v[4] === "Paid up" ? "rounded-full bg-pos-bg px-2.5 py-1 text-xs font-semibold text-pos" : "rounded-full bg-due-bg px-2.5 py-1 text-xs font-semibold text-due"}>{v[4]}</span>
              </div>
            ))}
            {!lk && (
              <p className="pt-1 text-[13px] leading-[1.45] text-muted">
                Driving for work? Log the miles and the allowance is added at the simplified rates.
              </p>
            )}
          </article>
          <PayrollDemo key={country} country={country} p={GO_PEOPLE.payroll[country]} />
        </div>
        <RatesNote country={country} />
      </Band>

      <QuoteRow id="proof-h" title="Less shoebox, more business." quotes={GO_QUOTES[country]} />

      <FaqBlock title="Spending, answered" items={GO_FAQ[country]} tone="white" />
      <div aria-hidden className="h-[clamp(64px,8vw,104px)]" />

      <ProductCta country={country} kicker={GO_CTA.kicker} dot="out" title={GO_CTA.title} text={GO_CTA.text} jar={lk ? "Rs 2,040,000" : "£16,260"} />
    </>
  );
}
