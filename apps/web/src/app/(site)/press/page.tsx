import type { Metadata } from "next";
import { CtaLink, H2, MoreLink, PageHero, Section, SectionHeading, StartFree } from "@/components/site";
import { ChangelogVisual } from "@/components/site/illustrations/resources/ChangelogVisuals";
import { PressArt } from "@/components/site/illustrations/resources/HeroArt";
import { BrandMark, cx } from "@/components/ui";
import { COMPANY } from "@/content/site/company";
import { MARK_SVG, PRESS } from "@/content/site/press";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";
import { CopyButton } from "./CopyButton";

export const metadata: Metadata = {
  title: "Press",
  description: "The BillingEase press kit: logo, colours, a paragraph about us and plain facts. Press questions go to a person by email.",
};

const H3 = "font-display text-[22px] font-bold tracking-[-0.02em]";

export default async function PressPage({ searchParams }: PageProps<"/press">) {
  const country = await getSiteCountry(searchParams);
  const logos = [
    { name: "On light", use: "For white and light backgrounds", bg: "bg-white", tile: "#18161F", word: "text-ink", svg: MARK_SVG("#18161F") },
    { name: "On dark", use: "For dark backgrounds and photos", bg: "bg-ink", tile: "#2E2B36", word: "text-white", svg: MARK_SVG("#2E2B36") },
    { name: "Mark only", use: "For app icons and small spaces", bg: "bg-tint", tile: "#18161F", word: "", svg: MARK_SVG("#18161F") },
  ];

  return (
    <>
      <PageHero
        kicker={PRESS.kicker}
        title={PRESS.title}
        lead={PRESS.lead}
        art={<PressArt />}
        actions={
          <>
            <CtaLink href="#kit-h" variant="dark" size="lg">
              Open the press kit
            </CtaLink>
            <CtaLink href={`mailto:${COMPANY.email.press}`} variant="soft" size="lg">
              {COMPANY.email.press}
            </CtaLink>
          </>
        }
      />

      <Section tone="white" labelledBy="news-h">
        <SectionHeading id="news-h" title={PRESS.news.title} aside={<CtaLink href={ROUTES.changelog.href} variant="soft" arrow>What’s new</CtaLink>} />
        <div className="flex items-start gap-4 border-y border-line py-7">
          <span aria-hidden className="flex size-11 flex-none items-center justify-center rounded-2xl bg-surface">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={ROUTES.press.icon} />
            </svg>
          </span>
          <p className="max-w-[720px] text-[17px] leading-relaxed text-ink2">{PRESS.news.body}</p>
        </div>
      </Section>

      <Section labelledBy="kit-h">
        <SectionHeading id="kit-h" title={PRESS.kit.title} lead={PRESS.kit.lead} />

        <div className="flex flex-col gap-4">
          <h3 className={H3}>Logo</h3>
          <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
            {logos.map((l) => (
              <li key={l.name} className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
                <span className={cx("flex h-[180px] items-center justify-center gap-3.5", l.bg)} role="img" aria-label={`BillingEase logo ${l.name.toLowerCase()}`}>
                  <BrandMark size={56} tile={l.tile} />
                  {l.word && <span className={cx("font-display text-[34px] font-bold tracking-[-0.03em]", l.word)}>BillingEase</span>}
                </span>
                <span className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-5">
                  <span className="flex flex-col">
                    <span className="font-bold">{l.name}</span>
                    <span className="text-sm text-ink2">{l.use}</span>
                  </span>
                  <CopyButton text={l.svg} done="SVG copied">
                    Copy mark SVG
                  </CopyButton>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[15px] leading-normal text-ink2">{PRESS.kit.logoNote}</p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className={H3}>Colours</h3>
          <ul className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 170px), 1fr))" }}>
            {PRESS.colours.map((c) => (
              <li key={c.hex} className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
                <span aria-hidden className="h-24 border-b border-line" style={{ background: c.hex }} />
                <span className="flex flex-1 flex-col gap-1 p-4">
                  <span className="font-bold">{c.name}</span>
                  <span className="text-sm text-ink2">{c.use}</span>
                  <CopyButton text={c.hex} done="Copied" className="mt-2 justify-between font-mono">
                    {c.hex}
                  </CopyButton>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className={H3}>Product pictures</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))" }}>
            <figure className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-3">
              <ChangelogVisual kind="home" country={country} />
              <figcaption className="mt-auto px-2 pb-1 text-[15px]">
                <strong>Home: the three numbers.</strong> <span className="text-ink2">What an owner sees first.</span>
              </figcaption>
            </figure>
            <figure className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-3">
              <ChangelogVisual kind="taxInvoice" country={country} />
              <figcaption className="mt-auto px-2 pb-1 text-[15px]">
                <strong>{country === "uk" ? "A VAT invoice, paid." : "A Tax Invoice with VAT and SSCL, paid."}</strong> <span className="text-ink2">Payments are recorded by hand.</span>
              </figcaption>
            </figure>
          </div>
          <p className="text-[15px] leading-normal text-ink2">
            Need full-size screenshots? Ask{" "}
            <a href={`mailto:${COMPANY.email.press}`} className="font-bold underline underline-offset-[3px]">
              {COMPANY.email.press}
            </a>
            . All sample figures and businesses are invented.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={H3}>About BillingEase, in one paragraph</h3>
            <CopyButton text={PRESS.boilerplate} done="Paragraph copied">
              Copy paragraph
            </CopyButton>
          </div>
          <p className="rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)] text-[17px] leading-relaxed">{PRESS.boilerplate}</p>
        </div>
      </Section>

      <Section tone="white" labelledBy="facts-h" innerClassName="flex-row! flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
          <h2 id="facts-h" className={H2}>
            Plain facts
          </h2>
          <dl className="grid gap-x-6 sm:grid-cols-2">
            {PRESS.facts.map((f) => (
              <div key={f.k} className="flex flex-col gap-1 border-t border-line py-5">
                <dt className="text-sm font-bold text-muted">{f.k}</dt>
                <dd className="text-[17px] font-semibold leading-snug">{f.v}</dd>
              </div>
            ))}
          </dl>
          <MoreLink href={ROUTES.about.href}>More about us</MoreLink>
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-[28px] bg-ink p-[clamp(24px,3.5vw,36px)] text-white">
          <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">Press contact</h2>
          <p className="text-[15px] leading-relaxed text-tint">Questions, interviews and pictures. A person replies by email.</p>
          <span className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-violet">Email</span>
            <a href={`mailto:${COMPANY.email.press}`} className="break-all text-lg font-bold underline-offset-4 hover:underline">
              {COMPANY.email.press}
            </a>
          </span>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <CopyButton text={COMPANY.email.press} done="Address copied" className="bg-violet hover:bg-[#a98ffb]">
              Copy email address
            </CopyButton>
            <CtaLink href={ROUTES.contact.href} variant="outlineLight" className="min-h-11 text-sm">
              Other questions
            </CtaLink>
          </div>
        </div>
      </Section>

      <section aria-labelledby="try-h" className="px-[clamp(16px,4vw,40px)] py-[clamp(48px,6vw,80px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center justify-between gap-x-12 gap-y-6 rounded-[32px] bg-tint px-[clamp(24px,5vw,72px)] py-[clamp(36px,5vw,64px)]">
          <div className="flex min-w-0 max-w-[620px] flex-[1_1_420px] flex-col gap-3">
            <h2 id="try-h" className="font-display text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.05] tracking-[-0.035em] text-balance">
              Try it before you write about it.
            </h2>
            <p className="text-lg leading-normal text-ink2">Start a free account in your country and send yourself an invoice.</p>
          </div>
          <StartFree country={country} variant="dark" size="lg" />
        </div>
      </section>
    </>
  );
}
