import type { Metadata } from "next";
import { RatesNote } from "@/components/site";
import { Composer, PayDemo, QuoteDemo, RemindDemo, RepeatList } from "@/components/site/illustrations/product/ComingInDemos";
import { ArrowLink, Band, FaqBlock, Heading, Kicker, ProductCta, ProductHero, Tag } from "@/components/site/illustrations/product/kit";
import {
  CI_COMPOSER,
  CI_CTA,
  CI_FACTS,
  CI_FAQ,
  CI_HERO,
  CI_MORE,
  CI_PAY,
  CI_QUOTE,
  CI_QUOTE_PROOF,
  CI_REMIND,
  CI_REPEAT,
  COMING_IN_META,
} from "@/content/site/coming-in";
import { money, pick } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = { title: COMING_IN_META.title, description: COMING_IN_META.description };

const CHECK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A5AF8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none">
    <path d="m5 12 5 5 9-10" />
  </svg>
);

export default async function ComingInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const lk = country === "lk";
  const comp = CI_COMPOSER[country];

  return (
    <>
      <ProductHero
        kicker={CI_HERO.kicker}
        title={CI_HERO.title}
        lead={pick(CI_HERO.lead, country)}
        country={country}
        second={{ label: "See pricing", href: ROUTES.pricing.href }}
        small={CI_HERO.small}
        art={<Composer key={country} country={country} {...comp} />}
      />

      {/* Quotes */}
      <Band labelledBy="quote-h" tone="white" className="flex flex-wrap items-center gap-x-16 gap-y-10">
        <div className="flex min-w-0 max-w-[480px] flex-[1_1_380px] flex-col gap-[18px]">
          <Heading id="quote-h" kicker={CI_QUOTE.kicker} title={CI_QUOTE.title} lead={CI_QUOTE.lead} />
          <ul className="flex flex-col gap-2.5 text-[15px]">
            {CI_QUOTE.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                {CHECK}
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <span className="text-[13px] leading-[1.45] text-muted">{CI_QUOTE.small}</span>
        </div>
        <QuoteDemo key={country} country={country} q={CI_QUOTE.sample[country]} />
      </Band>

      {/* Getting paid */}
      <Band labelledBy="pay-h" className="flex flex-col gap-9">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
          <Heading id="pay-h" kicker={CI_PAY.kicker} title={pick(CI_PAY.title, country)} lead={pick(CI_PAY.lead, country)} className="flex-[1_1_460px]" />
          <ArrowLink href={ROUTES.pricing.href}>All plans</ArrowLink>
        </div>
        <PayDemo key={country} country={country} methods={CI_PAY.methods[country]} invoice={{ no: CI_REMIND[country].inv, who: CI_REMIND[country].who, amt: CI_REMIND[country].amt }} />
      </Band>

      {/* Repeating invoices + reminders */}
      <Band labelledBy="auto-h" tone="white" className="flex flex-col gap-9">
        <Heading id="auto-h" kicker={CI_REPEAT.kicker} title={CI_REPEAT.title} lead={pick(CI_REPEAT.lead, country)} />
        <div className="flex flex-wrap items-stretch gap-4">
          <article className="flex min-w-0 flex-[1_1_400px] flex-col gap-4 rounded-3xl bg-bg p-[clamp(20px,2.4vw,28px)]">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">Repeating invoices</h3>
              <span className="text-[13px] text-muted">Shown as “Repeating” in the app · monthly retainers</span>
            </div>
            <RepeatList key={country} country={country} reps={CI_REPEAT.reps[country]} />
          </article>
          <article className="flex min-w-0 flex-[1_1_400px] flex-col gap-4 rounded-3xl bg-bg p-[clamp(20px,2.4vw,28px)]">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">Reminders, already written</h3>
              <span className="text-[13px] text-muted">{lk ? "By email or WhatsApp · you press send" : "By email · you press send"}</span>
            </div>
            <RemindDemo key={country} country={country} r={CI_REMIND[country]} />
          </article>
        </div>
      </Band>

      {/* More ways money comes in */}
      <Band labelledBy="more-h" className="flex flex-col gap-9">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2 id="more-h" className="max-w-[720px] text-balance font-display text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em]">
            {pick(CI_MORE.title, country)}
          </h2>
          <span className="max-w-[360px] text-[13px] leading-[1.45] text-muted">{CI_MORE.aside}</span>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
          <article className="flex min-w-0 flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
            <div aria-hidden className="flex flex-col gap-2.5 rounded-[18px] bg-bg p-[18px]">
              <span className="flex justify-between text-xs font-bold">
                <span>CREDIT NOTE</span>
                <span className="text-muted">CN-0004</span>
              </span>
              <span className="font-bold">{lk ? "Lanka Agri Exports" : "Leeds Print Fest"}</span>
              <span className="flex justify-between gap-2.5 text-[13px] text-ink2">
                <span>{lk ? "Reprint of 200 catalogues" : "Misprinted posters"}</span>
                <span className="font-bold tabular-nums text-ink">−{money(lk ? 18000 : 60, country)}</span>
              </span>
              <span className="flex items-center justify-between gap-2.5 border-t border-line pt-2.5 text-[13px] text-ink2">
                <span>Taken off {lk ? "TI-0182" : "INV-0040"}</span>
                <Tag>Coming in −{money(lk ? 18000 : 60, country)}</Tag>
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">Money back to a customer</h3>
              <span className="text-[13px] text-muted">Credit notes</span>
            </div>
            <p className="text-[15px] leading-[1.55] text-ink2">Take money off an invoice with a credit note. It comes off Coming in straight away, with a PDF your customer can keep{lk ? ", VAT and SSCL adjusted" : ""}.</p>
          </article>
          <article className="flex min-w-0 flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
            <div aria-hidden className="flex flex-col gap-2 rounded-[18px] bg-bg p-[18px]">
              {(lk
                ? [
                    ["Logo design", 85000],
                    ["Brochure, per page", 12000],
                    ["Packaging design", 250000],
                    ["Social media month", 60000],
                  ]
                : [
                    ["Logo design", 650],
                    ["Label design, per label", 350],
                    ["Poster series", 620],
                    ["Social media month", 120],
                  ]
              ).map(([n, p]) => (
                <span key={n} className="flex items-center gap-2.5 text-[13px]">
                  <span className="min-w-0 flex-1 truncate font-semibold">{n}</span>
                  <span className="tabular-nums text-ink2">{money(p as number, country)}</span>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">Products and prices</h3>
              <span className="text-[13px] text-muted">Your price list</span>
            </div>
            <p className="text-[15px] leading-[1.55] text-ink2">Save what you sell and its price once, then pick it on any invoice or quote. A price list, not a stock count.</p>
          </article>
          <article className="flex min-w-0 flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
            <div aria-hidden className="flex flex-col gap-2.5 rounded-[18px] bg-bg p-[18px] text-[13px]">
              {(lk
                ? [
                    ["TIN", "104 567 890"],
                    ["VAT reg. no.", "104567890-7000"],
                    ["SSCL 2.5%", "Rs 6,250.00"],
                    ["VAT 18%", "Rs 46,125.00"],
                  ]
                : [
                    ["VAT number", "GB 123 4567 89"],
                    ["Standard 20%", "£370.00"],
                    ["Reduced 5%", "—"],
                    ["Zero-rated or exempt", "—"],
                  ]
              ).map(([k, v]) => (
                <span key={k} className="flex justify-between gap-2.5">
                  <span className="text-ink2">{k}</span>
                  <span className="font-semibold tabular-nums">{v}</span>
                </span>
              ))}
              <span className="border-t border-line pt-2.5 text-xs text-ink2">{lk ? "Titled “Tax Invoice” when you’re VAT registered." : "VAT shown when you tell BillingEase you’re registered."}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{lk ? "Tax Invoices, VAT and SSCL" : "VAT invoices"}</h3>
              <span className="text-[13px] text-muted">{lk ? "IRD format · sample numbers" : "For VAT-registered businesses · sample numbers"}</span>
            </div>
            <p className="text-[15px] leading-[1.55] text-ink2">
              {lk
                ? "SSCL at 2.5% on its own line and VAT at 18%, with zero-rated and exempt options. Totals add up for each VAT and SSCL period."
                : "VAT at 20%, 5%, 0% or exempt on each line. Totals add up for each VAT quarter, ready for your accountant to file."}
            </p>
          </article>
        </div>
        <RatesNote country={country} />
      </Band>

      {/* Proof */}
      <Band labelledBy="proof-h" tone="white" className="flex flex-wrap items-center gap-x-16 gap-y-10">
        <h2 id="proof-h" className="basis-full">
          <Kicker>
            In practice <span className="font-semibold text-muted">· illustrative example, not a real customer</span>
          </Kicker>
        </h2>
        <figure className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
          <blockquote className="text-pretty font-display text-[clamp(24px,2.8vw,36px)] font-semibold leading-[1.25] tracking-[-0.02em]">“{CI_QUOTE_PROOF[country].quote}”</blockquote>
          <figcaption className="flex items-center gap-3">
            <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-violet font-bold">
              {CI_QUOTE_PROOF[country].name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </span>
            <span className="flex flex-col">
              <span className="font-bold">{CI_QUOTE_PROOF[country].name}</span>
              <span className="text-[13px] text-muted">{CI_QUOTE_PROOF[country].role}</span>
            </span>
          </figcaption>
        </figure>
        <ul className="grid min-w-0 flex-[1_1_340px] grid-cols-2 gap-3">
          {CI_FACTS[country].map(([n, t]) => (
            <li key={t} className="flex flex-col gap-1 rounded-[18px] bg-bg p-[18px]">
              <span className="whitespace-nowrap font-display text-[28px] font-bold tracking-[-0.03em] tabular-nums">{n}</span>
              <span className="text-[13px] leading-[1.45] text-muted">{t}</span>
            </li>
          ))}
        </ul>
      </Band>

      <FaqBlock title="Getting paid, answered" items={CI_FAQ[country]} />

      <ProductCta country={country} kicker={CI_CTA.kicker} title={pick(CI_CTA.title, country)} text={CI_CTA.text} jar={lk ? "Rs 2,040,000" : "£16,260"} />
    </>
  );
}
