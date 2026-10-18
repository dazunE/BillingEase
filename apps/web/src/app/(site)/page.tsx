import type { Metadata } from "next";
import Link from "next/link";
import { ClosingBand } from "@/components/landing/ClosingBand";
import { HeroEquation } from "@/components/landing/HeroEquation";
import { HeroScene } from "@/components/landing/HeroScene";
import { BillScene, DeskScene, KeepScene, OutScene, ThinkingPerson } from "@/components/landing/Illustrations";
import { NeedsYouDemo } from "@/components/landing/NeedsYouDemo";
import { SampleProvider } from "@/components/landing/SampleProvider";
import { ArrowIcon, Container, Faq, H1, H2, IconTile, MoreLink, PlanCard, Section, SectionHeading, StartFree } from "@/components/site";
import s from "@/components/site/site.module.css";
import { cx } from "@/components/ui";
import { money, pick } from "@/content/site/country";
import { FEATURES, HERO, HOME_FAQ, HOME_META, NEEDS_YOU, NEEDS_YOU_COPY, PRICING_TEASER, STEPS, WHO } from "@/content/site/home";
import { PLANS, PRICE_NOTE } from "@/content/site/plans";
import { SAMPLES, sampleNumbers } from "@/content/site/samples";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = {
  title: { absolute: HOME_META.title },
  description: HOME_META.description,
};

const TINT = { in: "violet", out: "orange", keep: "dark" } as const;
const DOT = { in: "bg-coming", out: "bg-going", keep: "bg-violet" } as const;

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const first = SAMPLES[country][0];
  const keepFirst = money(sampleNumbers(first).keep, country);
  const needs = NEEDS_YOU[country];

  return (
    <SampleProvider key={country} country={country}>
      {/* 1 · Hero: the concept, the jar, and the live sample equation */}
      <section aria-labelledby="hero-h">
        <Container className="flex flex-col gap-9 pb-[clamp(64px,9vw,120px)] pt-[clamp(40px,7vw,96px)]">
          <div className="flex flex-col items-center gap-[18px] text-center">
            <h1 id="hero-h" className={cx(H1, "max-w-[980px]")}>
              {HERO.title}
            </h1>
            <p className="max-w-[680px] text-balance text-[clamp(17px,1.6vw,20px)] leading-normal text-ink2">{pick(HERO.lead, country)}</p>
          </div>
          <HeroScene />
          <div className="flex flex-col gap-[18px]">
            <HeroEquation />
            <div className="flex flex-wrap items-center justify-center gap-x-[18px] gap-y-2.5 pt-2.5">
              <StartFree country={country} size="lg">
                {HERO.cta}
              </StartFree>
              <span className="text-sm text-muted">{HERO.ctaNote}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* 2 · Home tells you what needs you */}
      <Section tone="white" labelledBy="ask-h">
        <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
          <div className="flex max-w-[680px] flex-[1_1_420px] flex-col gap-3">
            <h2 id="ask-h" className={cx(H2, "text-balance")}>
              {NEEDS_YOU_COPY.title}
            </h2>
            <p className="text-lg leading-normal text-ink2">{needs.lead}</p>
            <MoreLink href={NEEDS_YOU_COPY.more.href}>{NEEDS_YOU_COPY.more.label}</MoreLink>
          </div>
          <DeskScene chips={needs.chips} />
        </div>
        <NeedsYouDemo key={country} country={country} />
      </Section>

      {/* 3 · How it works */}
      <Section id="how" labelledBy="how-h">
        <h2 id="how-h" className={H2}>
          How it works
        </h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {STEPS.map((st, i) => (
            <li key={st.title} className="flex flex-col gap-[22px] rounded-3xl border border-line bg-white p-7">
              <span className="font-display text-[56px] font-bold leading-none tracking-[-0.04em]" aria-hidden>
                {i + 1}
              </span>
              <span className="flex flex-col gap-1.5">
                <span className="font-display text-[22px] font-bold tracking-[-0.02em]">
                  <span className="sr-only">Step {i + 1}: </span>
                  {st.title}
                </span>
                <span className="text-[15px] leading-normal text-ink2">{pick(st.body, country)}</span>
                <MoreLink href={st.link.href} className="mt-1.5">
                  {st.link.label}
                </MoreLink>
              </span>
              {i === 0 && <BillScene country={country} />}
              {i === 1 && <OutScene country={country} />}
              {i === 2 && <KeepScene country={country} amount={keepFirst} />}
            </li>
          ))}
        </ol>
      </Section>

      {/* 4 · Features: everything behind the three numbers */}
      <Section tone="white" labelledBy="feat-h">
        <SectionHeading id="feat-h" title={FEATURES.title} lead={pick(FEATURES.lead, country)} more={{ label: "See all features", href: "/features" }} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {FEATURES.columns.map((col) => (
            <div key={col.key} className={cx("flex flex-col gap-5 rounded-3xl p-7", col.key === "keep" ? "bg-ink text-white" : "bg-bg")}>
              <Link href={col.href} className="group inline-flex items-center gap-2 self-start">
                <span aria-hidden className={cx("size-2.5 rounded-full", DOT[col.key])} />
                <h3 className="font-display text-[22px] font-bold tracking-[-0.02em] underline-offset-4 group-hover:underline">{col.name}</h3>
                <ArrowIcon color={col.key === "keep" ? "#EEE8FF" : "#18161F"} />
              </Link>
              <ul className="flex flex-col gap-4">
                {col.items
                  .filter((it) => !it.only || it.only === country)
                  .map((it) => (
                    <li key={pick(it.title, country)} className="flex items-start gap-3">
                      <IconTile d={it.icon} tint={col.key === "keep" ? "violet" : TINT[col.key]} size={36} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[15px] font-bold">{pick(it.title, country)}</span>
                        <span className={cx("text-sm leading-normal", col.key === "keep" ? "text-tint" : "text-ink2")}>{pick(it.body, country)}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {FEATURES.shared.map((it) => (
            <li key={pick(it.title, country)} className="flex items-start gap-3.5 rounded-[20px] border border-line p-[22px]">
              <IconTile d={it.icon} tint="grey" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-base font-bold">{pick(it.title, country)}</span>
                <span className="text-sm leading-normal text-ink2">{pick(it.body, country)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 5 · Who it's for */}
      <Section id="who" labelledBy="who-h">
        <SectionHeading id="who-h" title={WHO.title} lead={pick(WHO.lead, country)} />
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-4">
          {WHO.cards[country].map((w, i) => (
            <li key={w.href + i} className="flex">
              <Link href={w.href} className={cx(s.lift, "flex flex-1 flex-col gap-4 rounded-3xl border border-line bg-white p-6 hover:border-input")}>
                <span aria-hidden className="relative block h-24 overflow-hidden rounded-2xl" style={{ background: w.tint }}>
                  <svg viewBox="0 0 240 96" width="100%" height="96" preserveAspectRatio="xMidYMid meet" className="block">
                    <path d={w.art} fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    <g className={cx(s.c, s.q)} style={{ animationDelay: `${-i * 0.8}s` }}>
                      <rect x="120" y="12" width="112" height="28" rx="14" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
                      <text x="176" y="31" textAnchor="middle" className="font-sans" fontSize="12" fontWeight="700" fill="#18161F">
                        {w.chip}
                      </text>
                    </g>
                  </svg>
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-xl font-bold tracking-[-0.02em]">{pick(w.label, country)}</span>
                  <span className="text-sm text-muted">{pick(w.hint, country)}</span>
                </span>
                <span className="text-[15px] leading-normal text-ink2">{pick(w.body, country)}</span>
                <span className={cx(s.go, "mt-auto inline-flex items-center gap-1.5 text-sm font-bold")}>
                  {pick(w.cta, country)}
                  <ArrowIcon />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 6 · Pricing teaser */}
      <Section id="pricing" tone="white" labelledBy="price-h">
        <SectionHeading id="price-h" title={PRICING_TEASER.title} lead={pick(PRICING_TEASER.lead, country)} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-stretch gap-4">
          {PLANS[country].map((p, i) => (
            <PlanCard key={p.id} plan={p} country={country} index={i} />
          ))}
        </div>
        <div className="flex flex-wrap items-stretch gap-4">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col justify-center gap-2 rounded-3xl bg-bg p-[clamp(20px,3vw,28px)]">
            <span className="font-display text-xl font-bold tracking-[-0.02em]">{country === "uk" ? "Prices in pounds" : "Prices in rupees"}</span>
            <span className="text-[15px] leading-normal text-ink2">{PRICE_NOTE}</span>
          </div>
          <Link href={PRICING_TEASER.compare.href} className={cx(s.lift, "box-border flex min-w-0 flex-[1_1_260px] flex-col justify-between gap-[18px] rounded-3xl border border-ink bg-ink p-[clamp(20px,3vw,28px)] text-white")}>
            <span className="flex flex-col gap-2">
              <span className="font-display text-[22px] font-bold tracking-[-0.02em] text-violet">{PRICING_TEASER.compare.title}</span>
              <span className="text-[15px] leading-normal text-tint">{PRICING_TEASER.compare.body}</span>
            </span>
            <span className={cx(s.go, "inline-flex items-center gap-2 text-[15px] font-bold")}>
              {PRICING_TEASER.compare.cta}
              <ArrowIcon size={16} color="#FFFFFF" />
            </span>
          </Link>
        </div>
      </Section>

      {/* 7 · FAQ */}
      <Section labelledBy="faq-h" innerClassName="flex-row! flex-wrap gap-x-16 gap-y-8">
        <div className="flex flex-[1_1_280px] flex-col gap-6">
          <h2 id="faq-h" className={H2}>
            Fair questions
          </h2>
          <ThinkingPerson />
        </div>
        <Faq items={HOME_FAQ[country]} className="flex-[999_1_520px]" />
      </Section>

      {/* 8 · Closing band */}
      <section aria-labelledby="close-h" className="px-[clamp(16px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-col items-start gap-6 rounded-[32px] bg-ink px-[clamp(24px,6vw,80px)] py-[clamp(40px,7vw,96px)]">
          <ClosingBand />
        </div>
      </section>
    </SampleProvider>
  );
}
