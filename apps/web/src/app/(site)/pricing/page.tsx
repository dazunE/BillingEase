import type { Metadata } from "next";
import Link from "next/link";
import { Container, CountrySwitch, IllustrativeQuote } from "@/components/site";
import { Band, FaqBlock, H2_PROD, Kicker, Pill, ProductCta } from "@/components/site/illustrations/product/kit";
import { PriceTags, SalesPeople } from "@/components/site/illustrations/product/PricingArt";
import { CompareTable, PlanCalc } from "@/components/site/illustrations/product/PricingDemos";
import { cx } from "@/components/ui";
import { COMPANY } from "@/content/site/company";
import { money, pick, signUpHref } from "@/content/site/country";
import { PLANS, PRICE_NOTE } from "@/content/site/plans";
import { PRICING_CALC, PRICING_COMPARE, PRICING_CTA, PRICING_FAQ, PRICING_HERO, PRICING_INCLUDED, PRICING_META, PRICING_QUOTES, PRICING_SALES } from "@/content/site/pricing";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = { title: PRICING_META.title, description: PRICING_META.description };

const LOOK = [
  { tag: "bg-surface text-ink", cta: "soft" as const, check: "bg-surface" },
  { tag: "bg-ink text-white", cta: "primary" as const, check: "bg-tint" },
  { tag: "bg-going-tint text-ink", cta: "dark" as const, check: "bg-going-tint" },
];

export default async function PricingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const lk = country === "lk";
  const plans = PLANS[country];

  return (
    <>
      {/* Hero + plans */}
      <section aria-labelledby="pr-h">
        <Container className="flex flex-col gap-[clamp(36px,5vw,56px)] pb-[clamp(56px,7vw,96px)] pt-[clamp(40px,6vw,88px)]">
          <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
            <div className="flex min-w-0 flex-[999_1_520px] flex-col items-start gap-5">
              <Kicker>{PRICING_HERO.kicker}</Kicker>
              <h1 id="pr-h" className="text-balance font-display text-[clamp(40px,6vw,80px)] font-bold leading-[1.02] tracking-[-0.035em]">
                {PRICING_HERO.title}
              </h1>
              <p className="max-w-[640px] text-pretty text-[clamp(17px,1.6vw,20px)] leading-normal text-ink2">{pick(PRICING_HERO.lead, country)}</p>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 pt-1.5">
                <CountrySwitch />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-due-bg px-3 py-1.5 text-[13px] font-bold text-due">{PRICING_HERO.draft}</span>
              </div>
            </div>
            <PriceTags mid={money(plans[1].price, country)} right={money(plans[2].price, country)} note={lk ? "prices in rupees" : "prices in pounds"} />
          </div>

          <div className="grid items-stretch gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
            {plans.map((p, i) => {
              const L = LOOK[i] ?? LOOK[0];
              const href = p.href === "signup" ? signUpHref(country) : p.href;
              return (
                <article key={p.id} aria-labelledby={`plan-${p.id}`} className={cx("relative box-border flex flex-col gap-[22px] rounded-3xl bg-white", p.popular ? "border-2 border-ink p-[27px]" : "border border-line p-7")}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 id={`plan-${p.id}`} className="font-display text-[22px] font-bold tracking-[-0.02em]">
                      {p.name}
                    </h2>
                    <span className={cx("whitespace-nowrap rounded-full px-3 py-[5px] text-xs font-bold", L.tag)}>{p.tag}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-[clamp(44px,4.6vw,60px)] font-bold leading-none tracking-[-0.04em] tabular-nums">{money(p.price, country)}</span>
                      {p.per && <span className="text-base text-ink2">{p.per}</span>}
                    </span>
                    <span className="min-h-5 text-sm text-muted">{p.price === 0 ? "Free for as long as you like" : "Placeholder price · not final"}</span>
                  </div>
                  <p className="min-h-12 text-[15px] leading-[1.55] text-ink2">{p.line}</p>
                  <Pill href={href} variant={L.cta} className="min-h-12 text-[15px]">
                    {p.cta}
                  </Pill>
                  <ul className="flex flex-col gap-[11px] border-t border-divider pt-5 text-[15px] leading-[1.4]">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span aria-hidden className={cx("mt-px flex size-5 flex-none items-center justify-center rounded-full", L.check)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 12 5 5 9-10" />
                          </svg>
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted">
            {PRICE_NOTE} Prices in {lk ? "rupees" : "pounds"}. No card needed for Free.
          </p>
        </Container>
      </section>

      {/* Included everywhere (replaces payment add-ons) */}
      <Band labelledBy="add-h" tone="white" className="flex flex-col gap-9">
        <div className="flex max-w-[680px] flex-col gap-3">
          <h2 id="add-h" className={H2_PROD}>
            {PRICING_INCLUDED.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{PRICING_INCLUDED.lead}</p>
        </div>
        <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
          {PRICING_INCLUDED.items.map((a) => (
            <li key={a.name} className="flex flex-col gap-3.5 rounded-3xl bg-bg p-[26px]">
              <span aria-hidden className="flex size-12 items-center justify-center rounded-[14px]" style={{ background: a.tint }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.icon} />
                </svg>
              </span>
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{a.name}</h3>
              <span className="font-display text-lg font-bold tracking-[-0.01em]">{pick(a.price, country)}</span>
              <p className="text-[15px] leading-[1.55] text-ink2">{pick(a.line, country)}</p>
              <span className="mt-auto text-[13px] text-muted">{a.where}</span>
            </li>
          ))}
        </ul>
      </Band>

      {/* Calculator */}
      <Band id="calculator" labelledBy="calc-h" className="flex flex-col gap-9">
        <div className="flex max-w-[720px] flex-col gap-3">
          <h2 id="calc-h" className={H2_PROD}>
            {PRICING_CALC.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{PRICING_CALC.lead}</p>
        </div>
        <PlanCalc key={country} country={country} plans={plans} presets={PRICING_CALC.presets[country]} maxPeople={PRICING_CALC.maxPeople} note={PRICE_NOTE} />
      </Band>

      {/* Compare */}
      <Band id="compare" labelledBy="cmp-h" tone="white" className="flex flex-col gap-7">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex max-w-[680px] flex-[1_1_480px] flex-col gap-3">
            <h2 id="cmp-h" className={H2_PROD}>
              Every feature, side by side.
            </h2>
            <p className="text-lg leading-[1.55] text-ink2">Grouped the way the app is: what’s coming in, what’s going out, and what’s yours to keep.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <CompareTable key={country} country={country} plans={plans} groups={PRICING_COMPARE[country]} />
        </div>
      </Band>

      {/* Proof */}
      <Band labelledBy="proof-h" className="flex flex-col gap-9">
        <h2 id="proof-h" className={cx(H2_PROD, "max-w-[760px]")}>
          Which plan, in practice.
        </h2>
        <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
          {PRICING_QUOTES[country].map((q) => (
            <li key={q.name} className="flex flex-col gap-3">
              <span className={cx("self-start rounded-full px-3 py-[5px] text-xs font-bold", q.tint === "violet" ? "bg-tint" : q.tint === "orange" ? "bg-going-tint" : "bg-surface")}>{q.plan}</span>
              <div className="flex-1">
                <IllustrativeQuote quote={q.quote} name={q.name} role={q.role} tint={q.tint} />
              </div>
            </li>
          ))}
        </ul>
      </Band>

      {/* Sales band */}
      <section aria-labelledby="sales-h" className="px-[clamp(16px,4vw,40px)] pb-[clamp(64px,9vw,120px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center gap-x-12 gap-y-7 rounded-[32px] bg-going-tint p-[clamp(28px,5vw,64px)]">
          <SalesPeople />
          <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-3.5">
            <h2 id="sales-h" className="text-balance font-display text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em]">
              {pick(PRICING_SALES.title, country)}
            </h2>
            <p className="max-w-[620px] text-[17px] leading-[1.55]">{PRICING_SALES.body}</p>
            <p className="text-[15px] leading-[1.55]">
              <strong>{lk ? "Practitioners:" : "Accountants:"}</strong> {pick(PRICING_SALES.acct, country)}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-1">
              <Pill href={ROUTES.contact.href} variant="dark" className="min-h-12 text-[15px]">
                Talk to sales
              </Pill>
              <Link href={ROUTES.accountants.href} className="inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-[3px]">
                {lk ? "BillingEase for practitioners" : "BillingEase for accountants"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FaqBlock
        title="Money questions"
        items={PRICING_FAQ[country]}
        tone="white"
        note={
          <>
            Something else? Write to <strong className="text-ink">{COMPANY.email.hello}</strong>.
          </>
        }
      />
      <div aria-hidden className="h-[clamp(48px,7vw,96px)]" />

      <ProductCta country={country} kicker={PRICING_CTA.kicker} title={pick(PRICING_CTA.title, country)} jar={lk ? "Rs 2,040,000" : "£16,260"} secondary={{ label: "See every feature", href: ROUTES.features.href }} />
    </>
  );
}
