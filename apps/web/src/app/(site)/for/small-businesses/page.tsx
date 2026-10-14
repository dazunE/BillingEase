import type { Metadata } from "next";
import { H2, RatesNote, Section } from "@/components/site";
import { TeamScene } from "@/components/site/illustrations/audience";
import { cx } from "@/components/ui";
import { COUNTRY_META, money } from "@/content/site/country";
import { PLANS } from "@/content/site/plans";
import { ROUTES } from "@/content/site/routes";
import { SAMPLES, sampleNumbers } from "@/content/site/samples";
import { SMALL, SMALL_META, TEAM_LIMIT } from "@/content/site/small-businesses";
import { getSiteCountry } from "@/lib/site-country";
import { AlsoFor, AudienceClose, AudienceHero, FaqBlock, FeatureCards, Heading, Kicker, MeetPersona, PlanPitch, QuoteWall } from "../_parts/blocks";
import { PayrollDemo } from "./PayrollDemo";
import { RolesTable } from "./RolesTable";

export const metadata: Metadata = { title: SMALL_META.title, description: SMALL_META.description };

export default async function SmallBusinessesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const P = SMALL[country];
  const biz = country === "uk" ? SAMPLES.uk.find((b) => b.key === "trades")! : SAMPLES.lk[0];
  const keep = sampleNumbers(biz).keep;
  const plan = PLANS[country].find((p) => p.popular)!;
  const doc = P.invoice.doc;

  return (
    <>
      <AudienceHero country={country} chip={{ icon: ROUTES.smallBusinesses.icon, tint: "green", label: P.chip }} title={P.hero.title} lead={P.hero.lead} link={P.hero.link} art={<TeamScene t={P.scene} />} />

      <MeetPersona country={country} avatar={country === "uk" ? "dan" : "ayesha"} title={P.meet.title} story={P.meet.story} byline={P.meet.byline} first={P.meet.first} caption={P.meet.caption} numbers={biz} />

      <Section id="roles" labelledBy="roles-h">
        <Heading id="roles-h" kicker={P.roles.kicker} dot="bg-pos" title={P.roles.title} lead={P.roles.lead} />
        <RolesTable key={country} roles={P.roles} />
      </Section>

      <Section tone="white" labelledBy="feat-h">
        <Heading id="feat-h" title={P.features.title} lead={P.features.lead} max={760} />
        <FeatureCards items={P.features.items} />
      </Section>

      <Section id="payroll" labelledBy="pay-h">
        <Heading id="pay-h" kicker={P.payroll.kicker} dot="bg-going" title={P.payroll.title} lead={P.payroll.lead} />
        <PayrollDemo key={country} country={country} banner={P.payroll.banner} />
        <RatesNote country={country} />
      </Section>

      <Section id="invoices" tone="white" labelledBy="inv-h" innerClassName="flex-row! flex-wrap items-center gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px]">
          <Kicker>{P.invoice.kicker}</Kicker>
          <h2 id="inv-h" className={cx(H2, "text-balance")}>
            {P.invoice.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{P.invoice.lead}</p>
          <ol className="flex flex-col gap-3.5">
            {P.invoice.points.map(([b, t], i) => (
              <li key={b} className="flex items-start gap-3">
                <span aria-hidden className="flex size-7 flex-none items-center justify-center rounded-full bg-tint font-display text-[13px] font-bold">
                  {i + 1}
                </span>
                <span className="text-base leading-[1.55] text-ink2">
                  <strong className="text-ink">{b}</strong> {t}
                </span>
              </li>
            ))}
          </ol>
          <RatesNote country={country} />
        </div>
        <div className="box-border flex min-w-0 flex-[1_1_420px] justify-center rounded-[28px] bg-tint p-[clamp(16px,4vw,48px)]">
          <div className="box-border flex w-full max-w-[420px] flex-col gap-3.5 rounded-[18px] bg-white p-[clamp(18px,3vw,28px)] text-sm shadow-[0_12px_32px_rgba(24,22,31,0.12)]">
            <span className="flex flex-wrap items-start justify-between gap-2">
              <span className="flex min-w-0 flex-col">
                <span className="font-bold">{doc.from}</span>
                <span className="text-xs text-muted">{doc.ids}</span>
              </span>
              <span className="font-display text-xs font-extrabold tracking-[0.06em]">{doc.kind}</span>
            </span>
            <span className="flex flex-col rounded-xl bg-bg p-3">
              <span className="text-[11px] font-bold tracking-[0.06em] text-muted">BILL TO</span>
              <span className="font-bold">{doc.to}</span>
            </span>
            {doc.rows.map(([l, v]) => (
              <span key={l} className="flex justify-between gap-3 border-b border-divider pb-2">
                <span className="text-ink2">{l}</span>
                <span className="tabular">{v}</span>
              </span>
            ))}
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-bold">Total</span>
              <span className="tabular font-display text-[24px] font-bold tracking-[-0.02em]">{doc.total}</span>
            </span>
            <span className="text-xs text-muted">{doc.foot}</span>
          </div>
        </div>
      </Section>

      <QuoteWall title={P.quotes.title} main={{ ...P.quotes.main, tint: "green" }} side={P.quotes.side.map((q, i) => ({ ...q, tint: i ? "violet" : "orange" }))} />

      <PlanPitch country={country} title={P.plan.title} why={P.plan.why} rows={P.plan.rows} plan={plan} extra={{ label: country === "lk" ? `More than ${TEAM_LIMIT} people? Talk to sales` : "A bigger business? Talk to sales", href: ROUTES.contact.href }} />

      <FaqBlock intro={P.faqIntro} items={P.faq} />

      <AlsoFor country={country} keys={country === "uk" ? ["soleTraders", "landlords", "accountants"] : ["soleTraders", "accountants", "countries"]} />

      <AudienceClose country={country} kicker={`${P.meet.first}’s ${COUNTRY_META[country].yearWord} so far: ${money(keep, country)} yours to keep`} title={P.close.title} keep={keep} />
    </>
  );
}
