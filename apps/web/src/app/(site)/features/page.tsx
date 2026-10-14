import type { Metadata } from "next";
import { Container } from "@/components/site";
import { BandArt, TapArt } from "@/components/site/illustrations/product/FeaturesArt";
import { FeaturesPlayer } from "@/components/site/illustrations/product/FeaturesPlayer";
import { ArrowLink, Band, CheckDot, Heading, Kicker, ProductCta, ProductHero, QuoteRow } from "@/components/site/illustrations/product/kit";
import { CountryPeek, WorksTabs } from "@/components/site/illustrations/product/Tabs";
import { cx } from "@/components/ui";
import { pick } from "@/content/site/country";
import {
  FEATURES_BUSINESS as BIZ,
  FEATURE_BANDS,
  FEATURES_CTA,
  FEATURES_HERO as HERO,
  FEATURES_META,
  FEATURES_PLAY,
  FEATURES_QUOTES,
  FEATURES_TAPS as TAPS,
  FEATURES_WORKS as WORKS,
} from "@/content/site/features";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = { title: FEATURES_META.title, description: FEATURES_META.description };

const BAND_ID = { in: "coming-in", out: "going-out", keep: "keep" } as const;
const BAND_DOT = { in: "in", out: "out", keep: "keep" } as const;
const TILE = { in: "bg-tint", out: "bg-going-tint", keep: "bg-tint" } as const;

export default async function FeaturesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const lk = country === "lk";

  return (
    <>
      <ProductHero
        kicker={HERO.kicker}
        title={HERO.title}
        lead={pick(HERO.lead, country)}
        country={country}
        second={{ label: "See pricing", href: ROUTES.pricing.href }}
        small={HERO.small}
        textBasis="440px"
        art={<FeaturesPlayer key={country} country={country} play={FEATURES_PLAY[country]} />}
      />

      {/* The three bands */}
      {FEATURE_BANDS.map((b) => (
        <section key={b.key} id={BAND_ID[b.key]} aria-labelledby={`${b.key}-h`} className={cx("scroll-mt-4", b.key !== "out" && "border-y border-line bg-white")}>
          <Container className="flex flex-wrap items-start gap-x-16 gap-y-10 py-[clamp(64px,9vw,120px)]">
            <div className="flex min-w-0 max-w-[460px] flex-[1_1_380px] flex-col gap-[18px]">
              <Kicker dot={BAND_DOT[b.key]}>{b.kicker}</Kicker>
              <h2 id={`${b.key}-h`} className="text-balance font-display text-[clamp(32px,3.8vw,50px)] font-bold leading-[1.05] tracking-[-0.035em]">
                {pick(b.title, country)}
              </h2>
              <p className="text-[17px] leading-[1.55] text-ink2">{pick(b.lead, country)}</p>
              <ArrowLink href={b.page.href}>{b.page.label}</ArrowLink>
              <BandArt kind={b.key} country={country} />
            </div>
            <ul className="grid min-w-0 flex-[999_1_520px] gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))" }}>
              {b.items
                .filter((it) => !it.only || it.only === country)
                .map((it) => (
                  <li key={pick(it.title, country)} className={cx("flex min-w-0 flex-col gap-3 rounded-[20px] p-[22px]", b.key === "out" ? "border border-line bg-white" : "bg-bg")}>
                    <span aria-hidden className={cx("flex size-11 flex-none items-center justify-center rounded-[14px]", TILE[b.key])}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d={it.icon} />
                      </svg>
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <h3 className="text-[17px] font-bold leading-[1.3]">{pick(it.title, country)}</h3>
                      <span className="text-[13px] leading-[1.45] text-muted">{pick(it.tag, country)}</span>
                    </span>
                    <p className="text-sm leading-[1.55] text-ink2">{pick(it.ex, country)}</p>
                  </li>
                ))}
            </ul>
          </Container>
        </section>
      ))}

      {/* You add it, the numbers follow */}
      <Band labelledBy="taps-h" tone="dark" className="flex flex-col gap-10">
        <Heading id="taps-h" kicker={TAPS.kicker} dot="violet" title={TAPS.title} lead={TAPS.lead} light />
        <ul className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))" }}>
          {TAPS.cards.map((c) => (
            <li key={c.key} className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-[#36323F] bg-[#24212C] p-[22px]">
              <TapArt kind={c.key} country={country} />
              <div className="flex flex-1 flex-col gap-1.5">
                <h3 className="text-lg font-bold text-white">{c.title}</h3>
                <p className="text-sm leading-[1.55] text-[#D9D4E6]">{pick(c.text, country)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Band>

      {/* Your business */}
      <Band labelledBy="biz-h" className="flex flex-col gap-9">
        <Heading id="biz-h" kicker={BIZ.kicker} dot="keep" title={BIZ.title} lead={BIZ.lead} />
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
          <article className="flex min-w-0 flex-col gap-[18px] rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
            <div className="flex flex-col gap-2 rounded-[18px] bg-bg p-[18px]">
              {BIZ.people.list[country].map((p) => (
                <span key={p[1]} className="flex items-center gap-2.5 text-[13px]">
                  <span aria-hidden className="flex size-8 flex-none items-center justify-center rounded-full text-[11px] font-bold" style={{ background: p[3] }}>
                    {p[0]}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{p[1]}</span>
                  <span className="whitespace-nowrap rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold">{p[2]}</span>
                </span>
              ))}
              <span className="flex items-center gap-2.5 pt-1 text-[13px] text-muted">
                <CheckDot tint="bg-pos-bg" stroke="#2F5711" />
                {lk ? "Request cleared: September’s bills added" : "Request cleared: records for 12–25 Sept added"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{pick(BIZ.people.title, country)}</h3>
              <p className="text-[15px] leading-[1.55] text-ink2">{pick(BIZ.people.body, country)}</p>
            </div>
            <ArrowLink href={BIZ.people.more[country].href} className="mt-auto">
              {BIZ.people.more[country].label}
            </ArrowLink>
          </article>
          <article className="flex min-w-0 flex-col gap-[18px] rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
            <div className="rounded-[18px] bg-bg p-[18px]">
              <CountryPeek key={country} initial={country} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{BIZ.country.title}</h3>
              <p className="text-[15px] leading-[1.55] text-ink2">{BIZ.country.body}</p>
            </div>
            <ArrowLink href={BIZ.country.more.href} className="mt-auto">
              {BIZ.country.more.label}
            </ArrowLink>
          </article>
          <article className="flex min-w-0 flex-col gap-[18px] rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
            <div className="flex flex-col gap-2.5 rounded-[18px] bg-bg p-[18px]">
              {BIZ.safe.list.map((t) => (
                <span key={t} className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <CheckDot tint="bg-pos-bg" stroke="#2F5711" size={28} />
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{BIZ.safe.title}</h3>
              <p className="text-[15px] leading-[1.55] text-ink2">{BIZ.safe.body}</p>
            </div>
            <ArrowLink href={BIZ.safe.more.href} className="mt-auto">
              {BIZ.safe.more.label}
            </ArrowLink>
          </article>
        </div>
      </Band>

      {/* Works with */}
      <Band labelledBy="int-h" tone="white" className="flex flex-col gap-7">
        <WorksTabs
          key={country}
          tabs={WORKS.tabs[country]}
          heading={
            <div className="flex min-w-0 max-w-[640px] flex-[1_1_420px] flex-col gap-3">
              <h2 id="int-h" className="text-balance font-display text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em]">
                {WORKS.title}
              </h2>
              <p className="text-[17px] leading-[1.55] text-ink2">{WORKS.lead}</p>
            </div>
          }
        />
      </Band>

      <QuoteRow id="proof-h" title="From people who’d rather not think about bookkeeping." quotes={FEATURES_QUOTES[country]} />

      <ProductCta country={country} kicker={FEATURES_CTA.kicker} title={FEATURES_CTA.title} text={FEATURES_CTA.text} jar={lk ? "Rs 2,040,000" : "£16,260"} />
    </>
  );
}
