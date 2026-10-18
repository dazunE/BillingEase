import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, CtaLink, FeatureGrid, PageHero, Section, SectionHeading } from "@/components/site";
import s from "@/components/site/site.module.css";
import { COVER_BG, GuideCover } from "@/components/site/illustrations/resources/GuideCovers";
import { GuidesArt } from "@/components/site/illustrations/resources/HeroArt";
import { cx } from "@/components/ui";
import { COMPANY } from "@/content/site/company";
import { pick } from "@/content/site/country";
import { GUIDE_CATEGORIES, GUIDES, GUIDES_PAGE, guidesFor, readMinutes, type Guide } from "@/content/site/guides";
import { guideHref, ROUTES, routeText } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";
import { GuideBrowser } from "./GuideBrowser";
import { CategoryChip, CountryChip, type GuideCardData } from "./GuideCard";

export const metadata: Metadata = {
  title: "Guides",
  description: "Short, plain-English guides for UK sole traders and landlords (Making Tax Digital, expenses, VAT) and Sri Lankan businesses (Tax Invoices, VAT and SSCL, EPF, ETF and APIT).",
};

const card = (g: Guide): GuideCardData => ({ slug: g.slug, title: g.title, dek: g.dek, category: g.category, country: g.country, cover: g.cover, minutes: readMinutes(g), date: g.date });

export default async function GuidesPage({ searchParams }: PageProps<"/guides">) {
  const country = await getSiteCountry(searchParams);
  const mine = guidesFor(country);
  const featured = mine.find((g) => g.featured && g.country === country) ?? mine[0];
  const longest = Math.max(...GUIDES.map(readMinutes));
  const help = routeText(ROUTES.help, country);
  const acc = routeText(ROUTES.accountants, country);

  return (
    <>
      <PageHero
        kicker={GUIDES_PAGE.kicker}
        title={GUIDES_PAGE.title}
        lead={pick(GUIDES_PAGE.lead, country)}
        art={<GuidesArt country={country} />}
        actions={
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-ink2">
            <li className="flex items-center gap-2">
              <StatIcon d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5" />
              <strong className="text-ink">{mine.length} guides</strong> for {country === "uk" ? "the UK" : "Sri Lanka"}
            </li>
            <li className="flex items-center gap-2">
              <StatIcon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />
              Each one under {longest + 1} minutes
            </li>
            <li className="flex items-center gap-2">
              <StatIcon d="m5 12 5 5 9-10" />
              Rates dated and marked illustrative
            </li>
          </ul>
        }
      />

      {/* Featured guide */}
      <section aria-labelledby="feat-h" className="pb-[clamp(56px,7vw,96px)]">
        <div className="mx-auto box-border max-w-[1200px] px-[clamp(16px,4vw,40px)]">
          <Link href={guideHref(featured.slug)} className={cx(s.lift, "flex flex-wrap overflow-hidden rounded-[32px] border border-line bg-white")}>
            <span className="flex min-w-0 flex-[1_1_420px] items-center justify-center p-[clamp(16px,3vw,32px)]" style={{ background: COVER_BG[featured.cover] }}>
              <GuideCover cover={featured.cover} className="h-auto w-full max-w-[520px] rounded-2xl" />
            </span>
            <span className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-4 p-[clamp(24px,4vw,48px)]">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-ink px-2.5 py-1 text-[13px] font-bold leading-none text-white">Start here</span>
                <CategoryChip category={featured.category} />
                <CountryChip country={featured.country} />
              </span>
              <span id="feat-h" className="font-display text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em] text-balance">
                {featured.title}
              </span>
              <span className="text-[17px] leading-normal text-ink2">{featured.dek}</span>
              <span className="text-sm text-muted">BillingEase team · {readMinutes(featured)} min read</span>
              <span className={cx(s.go, "inline-flex items-center gap-2 text-base font-bold")}>
                Read the guide
                <ArrowIcon size={16} />
              </span>
            </span>
          </Link>
        </div>
      </section>

      <Section labelledBy="browse-h" innerClassName="pt-0!">
        <GuideBrowser guides={GUIDES.map(card)} country={country} categories={GUIDE_CATEGORIES} />
        <p className="max-w-[760px] text-sm leading-normal text-muted">{GUIDES_PAGE.note}</p>
      </Section>

      <Section tone="white" labelledBy="answer-h">
        <SectionHeading id="answer-h" title="Need an answer, not an article?" />
        <FeatureGrid
          min={280}
          surface="grey"
          items={[
            { icon: ROUTES.help.icon, title: help.label, body: "Short answers about using BillingEase, and a person when you need one.", href: ROUTES.help.href, tint: "violet" },
            { icon: ROUTES.accountants.icon, title: acc.label, body: country === "uk" ? "How your accountant sees the same books, and sends your quarterly updates." : "How your tax practitioner sees the same books, and the year-end hand-off to TaxWise.lk.", href: ROUTES.accountants.href, tint: "orange" },
            { icon: ROUTES.contact.icon, title: "Talk to us", body: "Questions about BillingEase for your business or your practice. A person writes back.", href: ROUTES.contact.href, tint: "green" },
          ]}
        />
      </Section>

      {/* Ask for a guide (no newsletter yet: a plain email) */}
      <section aria-labelledby="ask-h" className="px-[clamp(16px,4vw,40px)] py-[clamp(48px,6vw,80px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center justify-between gap-x-12 gap-y-6 rounded-[32px] bg-tint px-[clamp(24px,5vw,64px)] py-[clamp(36px,5vw,64px)]">
          <div className="flex min-w-0 max-w-[620px] flex-[1_1_420px] flex-col gap-3">
            <span className="font-hand text-[28px] font-bold leading-none text-coming">a guide you’d like?</span>
            <h2 id="ask-h" className="font-display text-[clamp(30px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.035em] text-balance">
              Tell us what to explain next.
            </h2>
            <p className="text-lg leading-normal text-ink2">
              {country === "uk"
                ? "Payments on account, cash basis, Class 4 National Insurance: if something confuses you, it probably confuses other people too."
                : "Instalments, capital allowances, gratuity: if something confuses you, it probably confuses other people too."}{" "}
              Write to us and a person reads it.
            </p>
          </div>
          <CtaLink href={`mailto:${COMPANY.email.hello}?subject=${encodeURIComponent("A guide I’d like")}`} variant="dark" size="lg" arrow>
            Email {COMPANY.email.hello}
          </CtaLink>
        </div>
      </section>
    </>
  );
}

function StatIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A5AF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-none">
      <path d={d} />
    </svg>
  );
}
