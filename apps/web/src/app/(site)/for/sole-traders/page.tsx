import type { Metadata } from "next";
import { H2, IconTile, RatesNote, Section } from "@/components/site";
import { SoleTraderScene } from "@/components/site/illustrations/audience";
import { cx } from "@/components/ui";
import { COUNTRY_META, money } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import { SAMPLES, sampleNumbers } from "@/content/site/samples";
import { SOLE, SOLE_META, TAX_SECTION } from "@/content/site/sole-traders";
import { PLANS } from "@/content/site/plans";
import { HOME_ICONS } from "@/content/site/home";
import { getSiteCountry } from "@/lib/site-country";
import { AlsoFor, AudienceClose, AudienceHero, FaqBlock, FeatureCards, Heading, Kicker, MeetPersona, PlanPitch, QuoteWall } from "../_parts/blocks";
import { OwedList } from "./OwedList";
import { TaxPanel } from "./TaxPanel";
import { WeekStepper } from "./WeekStepper";

export const metadata: Metadata = { title: SOLE_META.title, description: SOLE_META.description };

export default async function SoleTradersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const P = SOLE[country];
  const biz = country === "uk" ? SAMPLES.uk[0] : SAMPLES.lk.find((b) => b.key === "bakery")!;
  const keep = sampleNumbers(biz).keep;
  const tax = TAX_SECTION[country];
  const plan = PLANS[country].find((p) => p.popular)!;
  const sym = COUNTRY_META[country].sym;

  return (
    <>
      <AudienceHero
        country={country}
        chip={{ icon: ROUTES.soleTraders.icon, tint: "violet", label: P.chip }}
        title={P.hero.title}
        lead={P.hero.lead}
        link={P.hero.link}
        art={<SoleTraderScene t={P.scene} />}
      />

      <MeetPersona
        country={country}
        avatar={country === "uk" ? "ellie" : "chaminda"}
        title={P.meet.title}
        story={P.meet.story}
        byline={P.meet.byline}
        first={P.meet.first}
        caption={P.meet.caption}
        numbers={biz}
      />

      <Section id="week" labelledBy="week-h">
        <Heading id="week-h" kicker={P.week.kicker} title={P.week.title} lead={P.week.lead} />
        <WeekStepper key={country} steps={P.week.steps} sym={sym} label="Steps of the job" />
      </Section>

      <Section tone="white" labelledBy="feat-h">
        <Heading id="feat-h" title={P.features.title} lead={P.features.lead} max={760} />
        <FeatureCards items={P.features.items} />
      </Section>

      <Section id="owed" labelledBy="owed-h">
        <Heading id="owed-h" title={P.owed.title} lead={P.owed.lead} />
        <div className="flex flex-wrap items-stretch gap-4">
          <OwedList key={country} list={P.owed.list} country={country} channel={country === "uk" ? "by email" : "by email and WhatsApp"} />
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-[22px]">
              <IconTile d={HOME_ICONS.repeat} tint="violet" />
              <h3 className="font-display text-lg font-bold tracking-[-0.02em]">{P.owed.repeat.title}</h3>
              <p className="text-sm leading-normal text-ink2">{P.owed.repeat.body}</p>
              <ol aria-label="Monthly drafts so far" className="flex flex-wrap gap-1.5">
                {P.owed.repeat.months.map((m, i) => (
                  <li key={i} className="flex flex-col items-center gap-1 text-[11px] font-bold text-muted">
                    <span className="flex size-[22px] items-center justify-center rounded-full bg-pos-bg">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2F5711" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    </span>
                    {m}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-[22px]">
              <h3 className="font-display text-lg font-bold tracking-[-0.02em]">{P.owed.back.title}</h3>
              <p className="text-sm leading-normal text-ink2">{P.owed.back.body}</p>
              <dl className="flex flex-col gap-1 text-[13px]">
                {P.owed.back.rows.map(([l, v], i) => (
                  <div key={l} className={cx("flex justify-between gap-3", i === P.owed.back.rows.length - 1 && "border-t border-line pt-1.5 font-bold")}>
                    <dt>{l}</dt>
                    <dd className="tabular">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </Section>

      <Section id="taxes" tone="white" labelledBy="tax-h" innerClassName="flex-row! flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px]">
          <Kicker dot="bg-violet">{tax.kicker}</Kicker>
          <h2 id="tax-h" className={cx(H2, "text-balance")}>
            {tax.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{tax.lead}</p>
          <ol className="flex flex-col gap-3.5">
            {tax.points.map(([b, t], i) => (
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
          <span className="text-[13px] text-muted">{tax.small}</span>
          <RatesNote country={country} />
        </div>
        <TaxPanel key={country} country={country} />
      </Section>

      <QuoteWall title={P.quotes.title} main={{ ...P.quotes.main, tint: "violet" }} side={P.quotes.side.map((q, i) => ({ ...q, tint: i ? "green" : "orange" }))} />

      <PlanPitch country={country} title={P.plan.title} why={P.plan.why} rows={P.plan.rows.map((r) => ({ name: r.name, line: r.line, value: r.value }))} plan={plan} />

      <FaqBlock intro={P.faqIntro} items={P.faq} />

      <AlsoFor country={country} keys={country === "uk" ? ["landlords", "smallBusinesses", "accountants"] : ["smallBusinesses", "accountants", "countries"]} />

      <AudienceClose country={country} kicker={`${P.meet.first}’s ${COUNTRY_META[country].yearWord} so far: ${money(keep, country)} yours to keep`} title={P.close.title} keep={keep} />
    </>
  );
}

