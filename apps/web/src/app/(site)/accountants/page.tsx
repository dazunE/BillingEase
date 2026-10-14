import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, CtaBand, IconTile, Section } from "@/components/site";
import { Avatar, PracticeScene } from "@/components/site/illustrations/audience";
import { cx } from "@/components/ui";
import { ACCT, ACCT_META } from "@/content/site/accountants";
import { COMPANY } from "@/content/site/company";
import { PLANS } from "@/content/site/plans";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";
import { AudienceHero, FaqBlock, Heading, Kicker, PlanPitch } from "../for/_parts/blocks";
import { WhatYouGet } from "./WhatYouGet";

export const metadata: Metadata = { title: ACCT_META.title, description: ACCT_META.description };

export default async function AccountantsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const P = ACCT[country];
  const base = PLANS[country].find((p) => p.id === "practice" || p.id === "practitioner")!;
  // plans.ts already marks what comes in the next phase.
  const plan = base;
  const tool = country === "uk" ? "the TaxWise practice workbench" : "TaxWise.lk";

  return (
    <>
      <AudienceHero
        country={country}
        chip={{ icon: ROUTES.accountants.icon, tint: "grey", label: P.chip }}
        title={P.hero.title}
        lead={P.hero.lead}
        primary={{ label: "Talk to us", href: ROUTES.contact.href }}
        secondary={{ label: "See per-client pricing", href: "#plan" }}
        note={P.hero.note}
        link={{ label: "What’s coming next", href: "#next" }}
        art={<PracticeScene t={P.scene} />}
      />

      <Section tone="white" labelledBy="clients-h">
        <Heading id="clients-h" kicker={P.clients.kicker} dot="bg-going" title={P.clients.title} lead={P.clients.lead} />
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
          {P.clients.items.map((c) => (
            <li key={c.title} className="flex flex-col gap-3 rounded-3xl bg-bg p-6">
              <IconTile d={c.icon} tint={c.tint} size={44} />
              <span className="font-display text-lg font-bold leading-tight tracking-[-0.02em]">{c.title}</span>
              <span className="text-sm leading-normal text-ink2">{c.body}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="get-h">
        <Heading id="get-h" kicker={P.get.kicker} title={P.get.title} />
        <WhatYouGet key={country} items={P.get.items} />
      </Section>

      <section aria-label="Illustrative quote" className="px-[clamp(16px,4vw,40px)]">
        <figure className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center gap-x-12 gap-y-6 rounded-[32px] bg-ink px-[clamp(24px,5vw,72px)] py-[clamp(32px,5vw,64px)] text-white">
          <span className="relative flex-none">
            <Avatar who={country === "uk" ? "priya" : "dan"} size={160} glasses />
            <span className="absolute -right-3 top-2 rounded-full border-2 border-ink bg-white px-2.5 py-1 text-xs font-bold text-ink">Illustrative</span>
          </span>
          <span className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
            <blockquote className="text-pretty font-display text-[clamp(22px,2.6vw,32px)] font-semibold leading-[1.3] tracking-[-0.02em]">“{P.quote.text}”</blockquote>
            <figcaption className="flex flex-col gap-0.5">
              <span className="font-bold text-violet">{P.quote.name}</span>
              <span className="text-sm text-tint">{P.quote.role}</span>
            </figcaption>
          </span>
        </figure>
      </section>

      <Section id="how" labelledBy="how-h">
        <Heading id="how-h" kicker={P.how.kicker} title={P.how.title} lead={P.how.lead} />
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-3">
          {P.how.steps.map((st, i) => (
            <li key={st.title} className={cx("flex flex-col gap-3 rounded-3xl border p-6", st.next ? "border-dashed border-input bg-transparent" : "border-line bg-white")}>
              <span className="flex items-center justify-between gap-2">
                <span aria-hidden className="font-display text-[40px] font-bold leading-none tracking-[-0.04em]">
                  {i + 1}
                </span>
                {st.next && <span className="rounded-full bg-due-bg px-2 py-0.5 text-[11px] font-bold text-due">Next phase</span>}
              </span>
              <span className="text-base font-bold">
                <span className="sr-only">Step {i + 1}: </span>
                {st.title}
              </span>
              <span className="text-sm leading-normal text-ink2">{st.body}</span>
            </li>
          ))}
        </ol>
      </Section>

      <PlanPitch country={country} title={P.pricing.title} why={P.pricing.why} rows={P.pricing.rows} plan={plan} extra={{ label: "Data processing terms", href: ROUTES.dataProcessing.href }} />

      <Section id="next" labelledBy="next-h" innerClassName="flex-row! flex-wrap items-stretch gap-x-6 gap-y-6">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 rounded-[28px] border border-dashed border-input p-[clamp(20px,3vw,32px)]">
          <Kicker dot="bg-due">Roadmap</Kicker>
          <h2 id="next-h" className="font-display text-[clamp(26px,3vw,36px)] font-bold leading-[1.1] tracking-[-0.03em]">
            {P.next.title}
          </h2>
          <p className="text-[15px] text-ink2">{P.next.lead}</p>
          <ul className="flex flex-col gap-3">
            {P.next.items.map((n) => (
              <li key={n.title} className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-due-bg px-2 py-0.5 text-[11px] font-bold text-due">Next</span>
                <span className="text-[15px] leading-normal">
                  <strong>{n.title}.</strong> <span className="text-ink2">{n.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-[1_1_360px] flex-col items-start gap-4 rounded-[28px] bg-white p-[clamp(20px,3vw,32px)]">
          <IconTile d={ROUTES.contact.icon} tint="violet" size={44} />
          <h3 className="font-display text-[clamp(22px,2.4vw,28px)] font-bold tracking-[-0.02em]">{P.talk.title}</h3>
          <p className="text-[15px] leading-normal text-ink2">{P.talk.body}</p>
          <a href={`mailto:${COMPANY.email.practices}`} className="inline-flex min-h-11 items-center gap-2 text-[15px] font-bold underline underline-offset-[3px]">
            {COMPANY.email.practices}
          </a>
          <Link href={ROUTES.contact.href} className="mt-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black">
            Contact us
            <ArrowIcon size={16} />
          </Link>
        </div>
      </Section>

      <FaqBlock title={country === "uk" ? "Questions from accountants" : "Questions from practitioners"} intro={`Something else? Write to ${COMPANY.email.practices}, or read the help centre. Everything here is about ${tool} and BillingEase together.`} items={P.faq} />

      <CtaBand title={P.close.title} lead={P.close.lead} primary={{ label: "Talk to us", href: ROUTES.contact.href }} secondary={{ label: "See pricing", href: ROUTES.pricing.href }} />
    </>
  );
}
