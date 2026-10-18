import type { Metadata } from "next";
import { CtaLink, H2, IconTile, PageHero, Section, SectionHeading } from "@/components/site";
import { CareersArt } from "@/components/site/illustrations/resources/HeroArt";
import { cx } from "@/components/ui";
import { CAREERS } from "@/content/site/careers";
import { COMPANY } from "@/content/site/company";
import { ROUTES } from "@/content/site/routes";

export const metadata: Metadata = {
  title: "Careers",
  description: "Work on BillingEase, bookkeeping for the UK and Sri Lanka. No roles are open right now; here’s how to get in touch.",
};

const mail = `mailto:${COMPANY.email.hello}?subject=${encodeURIComponent("Working at BillingEase")}`;

export default function CareersPage() {
  return (
    <>
      <PageHero
        kicker={CAREERS.kicker}
        title={CAREERS.title}
        lead={CAREERS.lead}
        art={<CareersArt />}
        actions={
          <>
            <CtaLink href={mail} variant="dark" size="lg">
              Write to us
            </CtaLink>
            <CtaLink href="#how-h" variant="soft" size="lg">
              How we work
            </CtaLink>
          </>
        }
      />

      <Section tone="white" id="how" labelledBy="how-h">
        <SectionHeading id="how-h" title={CAREERS.how.title} lead={CAREERS.how.lead} />
        <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))" }}>
          {CAREERS.how.items.map((x) => (
            <li key={x.title} className="flex flex-col gap-3 rounded-3xl bg-bg p-[26px]">
              <IconTile d={x.icon} tint={x.tint} size={48} />
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{x.title}</h3>
              <p className="text-[15px] leading-relaxed text-ink2">{x.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="roles-h">
        <h2 id="roles-h" className={cx(H2)}>
          {CAREERS.roles.title}
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6 rounded-3xl border border-line bg-white p-[clamp(22px,4vw,40px)]">
          <div className="flex min-w-0 flex-[1_1_380px] items-start gap-4">
            <span aria-hidden className="flex size-12 flex-none items-center justify-center rounded-2xl bg-surface">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h18v12H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
              </svg>
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="font-display text-[22px] font-bold tracking-[-0.02em]">{CAREERS.roles.none}</span>
              <span className="text-base leading-normal text-ink2">{CAREERS.roles.body}</span>
            </span>
          </div>
          <CtaLink href={mail} variant="dark" arrow>
            Email {COMPANY.email.hello}
          </CtaLink>
        </div>
      </Section>

      <Section tone="white" labelledBy="steps-h">
        <SectionHeading id="steps-h" title={CAREERS.steps.title} lead={CAREERS.steps.lead} />
        <ol className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))" }}>
          {CAREERS.steps.items.map((x, i) => (
            <li key={x.title} className="flex flex-col gap-3 rounded-3xl bg-bg p-[26px]">
              <span aria-hidden className="font-display text-[44px] font-bold leading-none tracking-[-0.04em]">
                {i + 1}
              </span>
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">
                <span className="sr-only">Step {i + 1}: </span>
                {x.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-ink2">{x.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <section aria-labelledby="curious-h" className="px-[clamp(16px,4vw,40px)] py-[clamp(48px,6vw,80px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center justify-between gap-x-12 gap-y-6 rounded-[32px] bg-tint px-[clamp(24px,5vw,72px)] py-[clamp(36px,5vw,64px)]">
          <div className="flex min-w-0 max-w-[660px] flex-[1_1_420px] flex-col gap-3">
            <h2 id="curious-h" className="font-display text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.05] tracking-[-0.035em] text-balance">
              Curious what you’d be building?
            </h2>
            <p className="text-lg leading-normal text-ink2">See what BillingEase does today, and why we built it.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <CtaLink href={ROUTES.features.href} variant="dark">
              See the features
            </CtaLink>
            <CtaLink href={ROUTES.about.href} variant="outline" className="bg-white">
              Our story
            </CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
