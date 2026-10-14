import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site";
import { Band, FaqBlock, H2_PROD, Kicker, Pill, ProductCta } from "@/components/site/illustrations/product/kit";
import { LockScene, Seal } from "@/components/site/illustrations/product/SecurityArt";
import { LedgerDemo, RoleTabs } from "@/components/site/illustrations/product/SecurityDemos";
import { cx } from "@/components/ui";
import { COMPANY } from "@/content/site/company";
import { pick } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import { SEC_CTA, SEC_DISCLOSURE, SEC_FAQ, SEC_HERO, SEC_LEDGER, SEC_LOCKS, SEC_PLANNED, SEC_PRIVACY, SEC_ROLES, SECURITY_META } from "@/content/site/security";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = { title: SECURITY_META.title, description: SECURITY_META.description };

export default async function SecurityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const lk = country === "lk";

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="sec-h">
        <Container className="flex flex-wrap items-center gap-x-14 gap-y-10 pb-[clamp(56px,8vw,104px)] pt-[clamp(40px,6vw,88px)]">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col items-start gap-5">
            <Kicker>{SEC_HERO.kicker}</Kicker>
            <h1 id="sec-h" className="text-balance font-display text-[clamp(40px,6vw,80px)] font-bold leading-[1.02] tracking-[-0.035em]">
              {SEC_HERO.title}
            </h1>
            <p className="max-w-[600px] text-pretty text-[clamp(17px,1.6vw,20px)] leading-normal text-ink2">{pick(SEC_HERO.lead, country)}</p>
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3 pt-1.5">
              <Link href="#how" className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-pos-bg px-5 text-[15px] font-bold text-pos">
                <span aria-hidden className="size-2 rounded-full bg-pos" />
                Six things we do today
              </Link>
              <Link href="#planned" className="inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-[3px]">
                What’s still planned
              </Link>
            </div>
          </div>
          <LockScene chips={SEC_HERO.chips} />
        </Container>
      </section>

      {/* How we protect your books */}
      <Band id="how" labelledBy="how-h" tone="white" className="flex flex-col gap-9">
        <div className="flex max-w-[720px] flex-col gap-3">
          <h2 id="how-h" className={H2_PROD}>
            {SEC_LOCKS.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{SEC_LOCKS.lead}</p>
        </div>
        <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
          {SEC_LOCKS.items.map((l) => (
            <li key={pick(l.t, country)} className="flex flex-col gap-3.5 rounded-3xl bg-bg p-[26px]">
              <span className="flex items-center justify-between gap-3">
                <span aria-hidden className="flex size-12 items-center justify-center rounded-[14px]" style={{ background: l.tint }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d={l.icon} />
                  </svg>
                </span>
                {l.status && <span className="rounded-full bg-due-bg px-2.5 py-1 text-xs font-bold text-due">{l.status}</span>}
              </span>
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{pick(l.t, country)}</h3>
              <p className="text-[15px] leading-[1.55] text-ink2">{pick(l.d, country)}</p>
              <span className="mt-auto self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink2">{l.tech}</span>
            </li>
          ))}
        </ul>
      </Band>

      {/* Who sees what */}
      <Band labelledBy="roles-h" className="flex flex-wrap items-start gap-x-16 gap-y-8">
        <div className="flex min-w-0 flex-[0_1_400px] flex-col gap-4">
          <h2 id="roles-h" className={H2_PROD}>
            {SEC_ROLES.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{pick(SEC_ROLES.lead, country)}</p>
          <Link href={ROUTES.accountants.href} className="inline-flex min-h-11 items-center self-start text-[15px] font-semibold underline underline-offset-[3px]">
            {lk ? "How practitioners work with you" : "How accountants work with you"}
          </Link>
        </div>
        <RoleTabs key={country} roles={SEC_ROLES.roles[country]} />
      </Band>

      {/* Ledger (replaces the prototype's status page: we publish no uptime yet) */}
      <Band labelledBy="ledger-h" tone="white" className="flex flex-col gap-7">
        <div className="flex max-w-[680px] flex-col gap-3">
          <h2 id="ledger-h" className={H2_PROD}>
            {SEC_LEDGER.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{SEC_LEDGER.lead}</p>
        </div>
        <LedgerDemo key={country} country={country} />
      </Band>

      {/* Privacy */}
      <section aria-labelledby="priv-h" className="px-[clamp(16px,4vw,40px)] py-[clamp(64px,9vw,120px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-col gap-8 rounded-[32px] bg-ink p-[clamp(28px,5vw,64px)] text-white">
          <div className="flex max-w-[760px] flex-col gap-3.5">
            <Kicker dot="violet" light>
              Privacy
            </Kicker>
            <h2 id="priv-h" className="text-balance font-display text-[clamp(32px,4.2vw,56px)] font-bold leading-[1.05] tracking-[-0.035em] text-violet">
              {SEC_PRIVACY.title}
            </h2>
            <p className="text-lg leading-normal text-tint">{SEC_PRIVACY.lead}</p>
          </div>
          <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
            {SEC_PRIVACY.items[country].map((p) => (
              <li key={p.t} className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.06] p-[22px]">
                <span className="text-[17px] font-bold">{p.t}</span>
                <span className="text-[15px] leading-[1.55] text-tint">{p.d}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Pill href={ROUTES.privacy.href} className="min-h-12 text-[15px]">
              Read the privacy notice
            </Pill>
            <span className="text-[15px] text-tint">
              Privacy questions: <strong className="text-white">{COMPANY.email.privacy}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Planned */}
      <Band id="planned" labelledBy="plan-h" tone="white" className="flex flex-col gap-9">
        <div className="flex max-w-[720px] flex-col gap-3">
          <h2 id="plan-h" className={H2_PROD}>
            {SEC_PLANNED.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{SEC_PLANNED.lead}</p>
        </div>
        <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
          {SEC_PLANNED.items[country].map((b) => (
            <li key={b.t} className="flex flex-col gap-3.5 rounded-3xl bg-bg p-[26px]">
              <Seal l1={b.l1} l2={b.l2} tint={b.tint} />
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{b.t}</h3>
              <p className="text-[15px] leading-[1.55] text-ink2">{b.d}</p>
              <span className="mt-auto self-start rounded-full bg-due-bg px-2.5 py-1 text-xs font-bold text-due">{b.how}</span>
            </li>
          ))}
        </ul>
      </Band>

      {/* Disclosure */}
      <Band labelledBy="disc-h" className="flex flex-wrap items-start gap-x-16 gap-y-8">
        <div className="flex min-w-0 flex-[0_1_420px] flex-col gap-4">
          <h2 id="disc-h" className={H2_PROD}>
            Found a hole? Tell us.
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">If you think you’ve found a security problem in BillingEase, we want to hear about it first, and we’ll thank you properly.</p>
          <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-white p-5">
            <span className="text-[13px] font-semibold text-muted">Write to</span>
            <a href={`mailto:${COMPANY.email.security}`} className="font-display text-xl font-bold underline-offset-4 [overflow-wrap:anywhere] hover:underline">
              {COMPANY.email.security}
            </a>
          </div>
        </div>
        <ol className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
          {SEC_DISCLOSURE.map((d, i) => (
            <li key={d.t} className="flex items-start gap-4 rounded-[20px] border border-line bg-white p-5">
              <span aria-hidden className={cx("flex size-9 flex-none items-center justify-center rounded-full font-display font-bold", i === 3 ? "bg-violet" : "bg-tint")}>
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-[17px] font-bold">{d.t}</span>
                <span className="text-[15px] leading-[1.55] text-ink2">{d.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </Band>

      <FaqBlock
        title="Fair questions"
        items={SEC_FAQ[country]}
        tone="white"
        note={
          <>
            Your {lk ? "practitioner" : "accountant"} has a harder one? Write to <strong className="text-ink">{COMPANY.email.security}</strong>.
          </>
        }
      />
      <div aria-hidden className="h-[clamp(48px,7vw,96px)]" />

      <ProductCta country={country} kicker={SEC_CTA.kicker} title={SEC_CTA.title} jar={lk ? "Rs 2,040,000" : "£16,260"} />
    </>
  );
}
