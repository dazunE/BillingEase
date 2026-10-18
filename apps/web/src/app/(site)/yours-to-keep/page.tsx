import type { Metadata } from "next";
import { CashJar } from "@/components/CashJar";
import { RatesNote } from "@/components/site";
import { InviteDemo, KeepCalc, LockDemo, PeriodCard, ReconcileDemo, ReportTabs } from "@/components/site/illustrations/product/KeepDemos";
import { Band, CheckDot, FaqBlock, Heading, Kicker, ProductCta, ProductHero } from "@/components/site/illustrations/product/kit";
import { cx } from "@/components/ui";
import { COUNTRY_META, pick } from "@/content/site/country";
import { KEEP_ACCT, KEEP_CALC, KEEP_CTA, KEEP_FAQ, KEEP_FILE, KEEP_HERO, KEEP_META, KEEP_PROOF, KEEP_REPORTS, KEEP_TAX } from "@/content/site/keep";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = { title: KEEP_META.title, description: KEEP_META.description };

export default async function KeepPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const lk = country === "lk";
  const person = KEEP_ACCT.person[country];
  const dates = KEEP_TAX.dates[country];

  return (
    <>
      <ProductHero
        kicker={KEEP_HERO.kicker}
        dot="keep"
        title={KEEP_HERO.title}
        lead={pick(KEEP_HERO.lead, country)}
        country={country}
        second={{ label: "See pricing", href: ROUTES.pricing.href }}
        small={KEEP_HERO.small}
        textBasis="400px"
        art={<KeepCalc key={country} country={country} c={KEEP_CALC[country]} />}
      />

      {/* The tax estimate */}
      <Band labelledBy="tax-h" tone="white" className="flex flex-col gap-10">
        <Heading id="tax-h" kicker={KEEP_TAX.kicker} dot="tax" title={pick(KEEP_TAX.title, country)} lead={pick(KEEP_TAX.lead, country)} />
        <ol className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
          {KEEP_TAX.steps[country].map((t) => (
            <li key={t.n} className="flex flex-col gap-3 rounded-[22px] bg-bg p-6">
              <span aria-hidden className="font-display text-[44px] font-bold leading-none tracking-[-0.04em]">
                {t.n}
              </span>
              <h3 className="text-lg font-bold">{t.t}</h3>
              <p className="text-[15px] leading-[1.55] text-ink2">{t.d}</p>
              <span className={cx("mt-auto self-start rounded-full px-3 py-1.5 text-sm font-bold tabular-nums", t.tint)}>{t.v}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3.5">
          <span className="text-[13px] font-bold">{dates.label}</span>
          <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}>
            {dates.items.map((q, i) => {
              const next = lk ? i === 1 : i === 2;
              return (
                <div key={q[0]} className={cx("flex flex-col gap-1 rounded-[18px] border p-4", next ? "border-ink bg-ink text-white" : "border-line bg-white")}>
                  <span className={cx("text-[13px] font-bold", next ? "text-tint" : "text-muted")}>{q[0]}</span>
                  <span className="font-display text-[22px] font-bold tabular-nums">{q[1]}</span>
                  <span className={cx("text-[13px]", next ? "text-tint" : "text-muted")}>{q[2]}</span>
                </div>
              );
            })}
          </div>
          <span className="text-[13px] leading-[1.45] text-muted">{pick(KEEP_TAX.note, country)}</span>
          <RatesNote country={country} />
        </div>
      </Band>

      {/* Reports */}
      <Band labelledBy="rep-h" className="flex flex-wrap items-start gap-x-16 gap-y-10">
        <ReportTabs
          key={country}
          reports={KEEP_REPORTS[country]}
          acct={person[1]}
          intro={
            <Heading
              id="rep-h"
              kicker="Reports"
              title="Reports that answer the question you actually asked."
              lead={`Every standard report is here, named after the question it answers. The formal name is underneath for your ${lk ? "practitioner" : "accountant"} and your bank.`}
              small
            />
          }
        />
      </Band>

      {/* Period + bank check */}
      <Band labelledBy="file-h" tone="white" className="flex flex-col gap-9">
        <Heading id="file-h" kicker={KEEP_FILE.kicker} dot="keep" title={pick(KEEP_FILE.title, country)} lead={KEEP_FILE.lead} />
        <div className="flex flex-wrap items-stretch gap-4">
          <PeriodCard key={`p${country}`} country={country} />
          <ReconcileDemo key={`r${country}`} country={country} />
        </div>
        {lk && <RatesNote country={country} />}
      </Band>

      {/* Accountant + lock */}
      <Band labelledBy="acct-h" className="flex flex-col gap-9">
        <Heading id="acct-h" kicker={pick(KEEP_ACCT.kicker, country)} title={KEEP_ACCT.title} lead={pick(KEEP_ACCT.lead, country)} />
        <div className="flex flex-wrap items-stretch gap-4">
          <article className="flex min-w-0 flex-[1_1_400px] flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{lk ? "Your practitioner, same books" : "Your accountant, same books"}</h3>
              <span className="text-[13px] text-muted">{lk ? "Through the TaxWise.lk practitioner tool" : "Through the TaxWise practice workbench"}</span>
            </div>
            <div className="flex flex-col gap-2.5 rounded-[18px] bg-bg p-[18px]">
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-full bg-[#FFF0B8] text-xs font-bold">
                  {person[0]}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-bold">{person[1]}</span>
                  <span className="text-[13px] text-muted">{person[2]} (sample)</span>
                </span>
              </span>
              {KEEP_ACCT.can[country].map(([t, yes]) => (
                <span key={t} className="flex items-center gap-2 text-[13px]">
                  {yes ? (
                    <CheckDot tint="bg-pos-bg" stroke="#2F5711" size={18} />
                  ) : (
                    <span aria-hidden className="flex size-[18px] flex-none items-center justify-center rounded-full bg-surface">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#47444F" strokeWidth="3.2" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </span>
                  )}
                  <span className={yes ? "" : "text-ink2"}>{t}</span>
                </span>
              ))}
            </div>
            <InviteDemo placeholderName={lk ? "Ruwan Jayasinghe" : "Priya Shah"} placeholderEmail={lk ? "ruwan@practice.lk" : "priya@practice.co.uk"} />
          </article>
          <LockDemo key={country} lock={KEEP_ACCT.lock[country]} />
        </div>
      </Band>

      {/* Proof */}
      <section aria-labelledby="proof-h" className="bg-ink text-white">
        <div className="mx-auto box-border flex w-full max-w-[1200px] flex-wrap items-center gap-x-16 gap-y-10 px-[clamp(16px,4vw,40px)] py-[clamp(64px,9vw,120px)]">
          <figure className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
            <h2 id="proof-h">
              <Kicker dot="violet" light>
                In practice · illustrative example, not a real customer
              </Kicker>
            </h2>
            <blockquote className="text-pretty font-display text-[clamp(24px,2.8vw,36px)] font-semibold leading-[1.25] tracking-[-0.02em]">“{KEEP_PROOF[country].quote}”</blockquote>
            <figcaption className="flex items-center gap-3">
              <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-violet font-bold text-ink">
                {KEEP_PROOF[country].name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </span>
              <span className="flex flex-col">
                <span className="font-bold">{KEEP_PROOF[country].name}</span>
                <span className="text-[13px] text-[#D9D4E6]">{KEEP_PROOF[country].role}</span>
              </span>
            </figcaption>
          </figure>
          <div aria-hidden className="flex min-w-0 flex-[1_1_260px] justify-center">
            <CashJar size={300} amount={KEEP_PROOF[country].jar} line="#EEE8FF" sym={COUNTRY_META[country].sym} className="h-auto max-w-full" />
          </div>
        </div>
      </section>

      <FaqBlock title="Profit and tax, answered" items={KEEP_FAQ[country]} />

      <ProductCta country={country} kicker={KEEP_CTA.kicker} dot="keep" title={KEEP_CTA.title} text={KEEP_CTA.text} jar={KEEP_PROOF[country].jar} />
    </>
  );
}
